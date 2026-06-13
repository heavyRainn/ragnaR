import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.cmc_service import (
    CoinMarketCapError,
    fetch_listings_latest,
    fetch_quotes_by_ids,
    parse_listing,
    parse_quote,
)
from app.services.signal_service import refresh_signals, resolve_active_signals_for_asset
from app.signals.helpers import compute_returns_from_prices, get_chronological_snapshots

logger = logging.getLogger(__name__)

_last_sync: datetime | None = None

# A single 60s sync interval should not move more than ~15% for top assets.
SOURCE_MISMATCH_THRESHOLD = 0.15
# Startup cleanup: purge history if any inter-snapshot return exceeds 20%.
ABNORMAL_HISTORY_RETURN_THRESHOLD = 0.20


def _is_price_source_mismatch(old_price: float, new_price: float) -> bool:
    if old_price <= 0:
        return False
    return abs(new_price - old_price) / old_price > SOURCE_MISMATCH_THRESHOLD


def _reset_asset_market_history(db: Session, asset: Asset, reason: str) -> None:
    db.execute(delete(MarketSnapshot).where(MarketSnapshot.asset_id == asset.id))
    resolve_active_signals_for_asset(db, asset.id)
    db.flush()
    logger.info("Reset market history for %s (%s)", asset.symbol, reason)


def _maybe_reset_before_snapshot(db: Session, asset: Asset, new_price: float) -> None:
    from app.signals.helpers import get_latest_snapshot

    latest = get_latest_snapshot(db, asset.id)
    if latest and _is_price_source_mismatch(float(latest.price), new_price):
        _reset_asset_market_history(db, asset, "source_mismatch")


def cleanup_mixed_mock_live_history(db: Session) -> int:
    """Remove mock snapshot history that contaminates live CMC signal evaluation."""
    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()
    purged = 0

    for asset in assets:
        chronological = get_chronological_snapshots(db, asset.id, limit=25)
        returns = compute_returns_from_prices(chronological)
        if any(abs(r) > ABNORMAL_HISTORY_RETURN_THRESHOLD for r in returns):
            _reset_asset_market_history(db, asset, "abnormal_return_in_history")
            purged += 1

    if purged:
        db.commit()
        refresh_signals(db)
        logger.info("Purged incompatible history for %s assets", purged)

    return purged


def _upsert_asset(db: Session, parsed: dict) -> Asset:
    symbol = parsed["symbol"]
    existing = db.execute(select(Asset).where(Asset.symbol == symbol)).scalar_one_or_none()

    if existing:
        existing.cmc_id = parsed["cmc_id"]
        existing.name = parsed["name"]
        existing.slug = parsed["slug"]
        existing.rank = parsed["rank"]
        existing.is_active = True
        return existing

    asset = Asset(
        cmc_id=parsed["cmc_id"],
        symbol=symbol,
        name=parsed["name"],
        slug=parsed["slug"],
        rank=parsed["rank"],
        category="cryptocurrency",
        is_active=True,
    )
    db.add(asset)
    db.flush()
    return asset


def _sync_from_listings(db: Session, api_key: str) -> int:
    limit = settings.CMC_LISTINGS_LIMIT
    raw_listings = fetch_listings_latest(api_key, start=1, limit=limit)
    synced = 0
    now = datetime.now(timezone.utc)

    for entry in raw_listings:
        parsed = parse_listing(entry)
        if not parsed:
            continue

        asset = _upsert_asset(db, parsed)
        new_price = float(parsed["price"])
        _maybe_reset_before_snapshot(db, asset, new_price)

        snapshot = MarketSnapshot(
            asset_id=asset.id,
            price=parsed["price"],
            volume_24h=parsed["volume_24h"],
            market_cap=parsed["market_cap"],
            percent_change_1h=parsed["percent_change_1h"],
            percent_change_24h=parsed["percent_change_24h"],
            percent_change_7d=parsed["percent_change_7d"],
            cmc_rank=parsed["cmc_rank"],
            captured_at=now,
        )
        db.add(snapshot)
        synced += 1

    return synced


def _sync_from_quotes(db: Session, api_key: str) -> int:
    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()
    cmc_ids = [a.cmc_id for a in assets if a.cmc_id is not None]
    if not cmc_ids:
        return 0

    raw = fetch_quotes_by_ids(api_key, cmc_ids)
    synced = 0
    now = datetime.now(timezone.utc)

    for asset in assets:
        if asset.cmc_id is None:
            continue

        parsed = parse_quote(asset.cmc_id, raw)
        if not parsed or parsed["price"] is None or parsed["volume_24h"] is None:
            continue

        if parsed["cmc_rank"] is not None:
            asset.rank = parsed["cmc_rank"]

        new_price = float(parsed["price"])
        _maybe_reset_before_snapshot(db, asset, new_price)

        snapshot = MarketSnapshot(
            asset_id=asset.id,
            price=parsed["price"],
            volume_24h=parsed["volume_24h"],
            market_cap=parsed["market_cap"],
            percent_change_1h=parsed["percent_change_1h"],
            percent_change_24h=parsed["percent_change_24h"],
            percent_change_7d=parsed["percent_change_7d"],
            cmc_rank=parsed["cmc_rank"],
            captured_at=now,
        )
        db.add(snapshot)
        synced += 1

    return synced


def sync_from_coinmarketcap(db: Session, *, force: bool = False) -> bool:
    """Fetch live data from CoinMarketCap listings and persist snapshots."""
    global _last_sync

    api_key = settings.CMC_API_KEY
    if not api_key:
        return False

    now = datetime.now(timezone.utc)
    interval = settings.cmc_sync_interval

    if not force and _last_sync and (now - _last_sync).total_seconds() < interval:
        return False

    try:
        synced = _sync_from_listings(db, api_key)
    except CoinMarketCapError as exc:
        logger.warning("CoinMarketCap listings sync failed, falling back to quotes: %s", exc)
        try:
            synced = _sync_from_quotes(db, api_key)
        except CoinMarketCapError as quote_exc:
            logger.warning("CoinMarketCap quotes sync failed: %s", quote_exc)
            return False
    except httpx.HTTPError as exc:
        logger.warning("CoinMarketCap HTTP error: %s", exc)
        return False

    if synced == 0:
        return False

    db.commit()
    refresh_signals(db)
    _last_sync = now
    logger.info("Synced %s assets from CoinMarketCap (limit=%s)", synced, settings.CMC_LISTINGS_LIMIT)
    return True


def get_last_sync_at() -> datetime | None:
    return _last_sync
