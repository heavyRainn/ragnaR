import logging
import time
from datetime import datetime, timezone
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.signals.helpers import count_snapshots

logger = logging.getLogger(__name__)

BYBIT_KLINE_URL = "https://api.bybit.com/v5/market/kline"

# Stablecoins — no spot kline backfill needed.
SKIP_BACKFILL_SYMBOLS = frozenset(
    {"USDT", "USDC", "DAI", "USDE", "FDUSD", "TUSD", "USDD", "USDS", "PYUSD"}
)

# Privacy / exchange-specific tokens commonly absent from Bybit spot.
UNSUPPORTED_ON_BYBIT_SPOT = frozenset(
    {
        "LEO",  # Bitfinex token — not on Bybit
        "XMR",  # Monero — delisted on most CEX spot books
        "DASH",
        "ZEC",  # Often unavailable or empty on Bybit spot
        "XVG",
        "ARRR",
        "BEAM",
        "MWC",
    }
)

# CMC symbol → Bybit spot pair when ticker differs.
BYBIT_PAIR_OVERRIDES: dict[str, str] = {
    "RENDER": "RNDRUSDT",
    "POL": "MATICUSDT",
}


def _candidate_pairs(symbol: str) -> list[str]:
    upper = symbol.upper()
    if upper in BYBIT_PAIR_OVERRIDES:
        return [BYBIT_PAIR_OVERRIDES[upper]]
    return [f"{upper}USDT", f"{upper}USDC"]


def _parse_kline_payload(raw_list: list) -> list[dict]:
    candles: list[dict] = []
    for row in reversed(raw_list):
        if len(row) < 7:
            continue
        candles.append(
            {
                "timestamp_ms": int(row[0]),
                "open": Decimal(row[1]),
                "close": Decimal(row[4]),
                "volume": Decimal(row[5]),
                "turnover": Decimal(row[6]),
            }
        )
    return candles


def _fetch_pair_klines(client: httpx.Client, pair: str) -> tuple[list[dict] | None, str | None]:
    params = {
        "category": "spot",
        "symbol": pair,
        "interval": "1",
        "limit": settings.BYBIT_BACKFILL_CANDLE_LIMIT,
    }

    response = client.get(BYBIT_KLINE_URL, params=params)
    response.raise_for_status()
    payload = response.json()

    ret_code = payload.get("retCode")
    ret_msg = payload.get("retMsg", "unknown")

    if ret_code != 0:
        return None, ret_msg

    raw_list = payload.get("result", {}).get("list") or []
    if not raw_list:
        return None, "empty kline list"

    candles = _parse_kline_payload(raw_list)
    return (candles if candles else None), None


def fetch_bybit_klines(symbol: str) -> list[dict] | None:
    upper = symbol.upper()

    if upper in SKIP_BACKFILL_SYMBOLS:
        logger.info("Bybit backfill skipped for stablecoin %s", symbol)
        return None

    if upper in UNSUPPORTED_ON_BYBIT_SPOT:
        logger.info("Bybit backfill skipped for %s — not available on Bybit spot", symbol)
        return None

    last_error: str | None = None

    try:
        with httpx.Client(timeout=10.0) as client:
            for pair in _candidate_pairs(symbol):
                try:
                    candles, error = _fetch_pair_klines(client, pair)
                except httpx.HTTPError as exc:
                    last_error = str(exc)
                    continue

                if candles:
                    logger.info("Bybit klines loaded for %s via %s (%s candles)", symbol, pair, len(candles))
                    return candles

                last_error = error
    except httpx.HTTPError as exc:
        logger.info("Bybit kline request failed for %s: %s", symbol, exc)
        return None

    if last_error:
        logger.info(
            "Bybit backfill skipped for %s — %s (CMC sync continues normally)",
            symbol,
            last_error,
        )
    return None


def backfill_asset_from_bybit(db: Session, asset: Asset) -> bool:
    candles = fetch_bybit_klines(asset.symbol)
    if not candles:
        return False

    existing_count = count_snapshots(db, asset.id)
    if existing_count > 1:
        logger.info("Bybit backfill skipped for %s — already has %s snapshots", asset.symbol, existing_count)
        return True

    prev_close: Decimal | None = None
    inserted = 0

    for candle in candles:
        captured_at = datetime.fromtimestamp(candle["timestamp_ms"] / 1000, tz=timezone.utc)
        close = candle["close"]
        turnover = candle["turnover"]

        if prev_close and prev_close > 0:
            step_pct = ((close - prev_close) / prev_close) * Decimal("100")
        else:
            step_pct = Decimal("0")

        snapshot = MarketSnapshot(
            asset_id=asset.id,
            price=close,
            volume_24h=max(turnover, Decimal("0")),
            market_cap=None,
            percent_change_1h=step_pct,
            percent_change_24h=step_pct,
            percent_change_7d=None,
            cmc_rank=asset.rank,
            captured_at=captured_at,
        )
        db.add(snapshot)
        prev_close = close
        inserted += 1

    db.flush()
    logger.info("Bybit backfill inserted %s snapshots for %s", inserted, asset.symbol)
    return inserted >= 21


def backfill_new_assets(db: Session) -> int:
    if not settings.BYBIT_BACKFILL_ENABLED or not settings.is_live_data:
        return 0

    pending = (
        db.execute(
            select(Asset)
            .where(
                Asset.is_active.is_(True),
                Asset.history_backfill_attempted.is_(False),
            )
            .order_by(Asset.rank.nulls_last(), Asset.symbol)
        )
        .scalars()
        .all()
    )

    if not pending:
        return 0

    batch = pending[: settings.BYBIT_BACKFILL_BATCH_SIZE]
    success_count = 0
    delay_sec = settings.BYBIT_BACKFILL_REQUEST_DELAY_MS / 1000.0

    for index, asset in enumerate(batch):
        asset.history_backfill_attempted = True
        try:
            if backfill_asset_from_bybit(db, asset):
                asset.history_backfilled = True
                success_count += 1
        except Exception:
            logger.exception("Bybit backfill failed for %s", asset.symbol)

        if index < len(batch) - 1 and delay_sec > 0:
            time.sleep(delay_sec)

    db.commit()
    return success_count
