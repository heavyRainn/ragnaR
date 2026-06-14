from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.sector_mapping import resolve_sector
from app.services.seed_data import (
    ANCHOR_PRICES,
    SEED_ASSETS,
    VOLUME_SHOCK_MULTIPLIERS,
)
from app.services.signal_service import refresh_signals

SEED_SNAPSHOT_COUNT = 25
PRICE_SHOCK_ASSETS = {"SOL", "NEAR", "INJ", "APT", "SUI"}
QUIET_ACCUMULATION_ASSETS = {"LINK", "TON", "ARB", "OP", "LDO"}


def _symbol_hash(symbol: str) -> int:
    return sum(ord(c) for c in symbol)


def _default_pct_change(symbol: str, rank: int) -> Decimal:
    h = _symbol_hash(symbol)
    base = ((h % 23) - 11) * 0.28
    rank_adj = (rank % 7 - 3) * 0.15
    return Decimal(str(round(base + rank_adj, 2)))


def _base_volume(rank: int) -> Decimal:
    cap = Decimal("45000000000") / Decimal(str(rank))
    return max(cap, Decimal("50000000")).quantize(Decimal("1"))


def _market_cap(rank: int, price: Decimal) -> Decimal:
    supply_factor = Decimal(str(max(1_000_000_000 // rank, 10_000_000)))
    return (price * supply_factor).quantize(Decimal("1"))


def is_seeded(db: Session) -> bool:
    count = db.execute(select(func.count()).select_from(Asset)).scalar_one()
    return count > 0


def seed_database(db: Session) -> None:
    if settings.is_live_data:
        return
    if is_seeded(db):
        return

    now = datetime.now(timezone.utc)

    for item in SEED_ASSETS:
        symbol = item["symbol"]
        rank = item["rank"]
        asset = Asset(
            cmc_id=item["cmc_id"],
            symbol=symbol,
            name=item["name"],
            slug=item["slug"],
            rank=rank,
            category=resolve_sector(symbol),
            is_active=True,
            history_backfill_attempted=True,
            history_backfilled=True,
        )
        db.add(asset)
        db.flush()

        base_price = Decimal(ANCHOR_PRICES.get(symbol, "1.00"))
        base_volume = _base_volume(rank)
        mcap = _market_cap(rank, base_price)
        default_pct = _default_pct_change(symbol, rank)

        current_price = base_price
        prev_price = base_price

        for i in range(SEED_SNAPSHOT_COUNT):
            captured_at = now - timedelta(hours=4 * (SEED_SNAPSHOT_COUNT - 1 - i))
            is_latest = i == SEED_SNAPSHOT_COUNT - 1

            if is_latest and symbol in PRICE_SHOCK_ASSETS:
                current_price = (prev_price * Decimal("1.085")).quantize(Decimal("0.00000001"))
            elif not is_latest:
                step_pct = Decimal(str(0.0015 * ((i * 5 + _symbol_hash(symbol)) % 7 - 3)))
                current_price = (prev_price * (Decimal("1") + step_pct)).quantize(Decimal("0.00000001"))
            else:
                step_pct = Decimal(str(0.001 * (i % 3 - 1)))
                current_price = (prev_price * (Decimal("1") + step_pct)).quantize(Decimal("0.00000001"))

            volume_multiplier = 1.0 + (i % 5) * 0.02
            if is_latest and symbol in VOLUME_SHOCK_MULTIPLIERS:
                volume_multiplier = VOLUME_SHOCK_MULTIPLIERS[symbol]
            elif is_latest and symbol in QUIET_ACCUMULATION_ASSETS:
                volume_multiplier = 4.0

            volume = base_volume * Decimal(str(volume_multiplier))

            if is_latest and symbol in QUIET_ACCUMULATION_ASSETS:
                pct_24h = Decimal("0.80") if symbol == "LINK" else Decimal("1.10")
            elif is_latest and symbol in PRICE_SHOCK_ASSETS:
                pct_24h = Decimal("8.50")
            else:
                pct_24h = default_pct + Decimal(str(0.05 * (i % 4 - 2)))
                pct_24h = pct_24h.quantize(Decimal("0.01"))

            snapshot = MarketSnapshot(
                asset_id=asset.id,
                price=current_price,
                volume_24h=volume,
                market_cap=mcap,
                percent_change_1h=Decimal(str(round(float(pct_24h) * 0.12, 2))),
                percent_change_24h=pct_24h,
                percent_change_7d=Decimal(str(round(float(pct_24h) * 2.2, 2))),
                cmc_rank=rank,
                captured_at=captured_at,
            )
            db.add(snapshot)
            prev_price = current_price

    db.commit()
    refresh_signals(db)
