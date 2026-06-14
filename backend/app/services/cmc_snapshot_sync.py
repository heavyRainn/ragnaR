from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.bybit_backfill_service import fetch_latest_bybit_turnover
from app.services.snapshot_history_service import align_snapshot_timestamp
from app.signals.helpers import get_latest_snapshot
from app.signals.volume_metrics import VOLUME_SOURCE_CMC


def apply_cmc_fields(
    snapshot: MarketSnapshot,
    parsed: dict,
    *,
    volume_1m: Decimal | None,
) -> None:
    snapshot.price = parsed["price"]
    snapshot.volume_24h = parsed["volume_24h"]
    snapshot.market_cap = parsed["market_cap"]
    snapshot.percent_change_1h = parsed["percent_change_1h"]
    snapshot.percent_change_24h = parsed["percent_change_24h"]
    snapshot.percent_change_7d = parsed["percent_change_7d"]
    snapshot.cmc_rank = parsed["cmc_rank"]
    if volume_1m is not None:
        snapshot.volume_1m = volume_1m
    snapshot.volume_source = VOLUME_SOURCE_CMC


def upsert_cmc_snapshot(db: Session, asset: Asset, parsed: dict, captured_at: datetime) -> bool:
    """Insert or update the aligned-minute snapshot with fresh CMC quote fields."""
    aligned_at = align_snapshot_timestamp(captured_at)

    volume_1m = None
    if settings.is_live_data and settings.BYBIT_BACKFILL_ENABLED:
        volume_1m = fetch_latest_bybit_turnover(asset.symbol)

    latest = get_latest_snapshot(db, asset.id)
    if latest:
        latest_aligned = align_snapshot_timestamp(latest.captured_at)
        if latest_aligned >= aligned_at:
            apply_cmc_fields(latest, parsed, volume_1m=volume_1m)
            return True

    snapshot = MarketSnapshot(
        asset_id=asset.id,
        price=parsed["price"],
        volume_24h=parsed["volume_24h"],
        volume_1m=volume_1m,
        volume_source=VOLUME_SOURCE_CMC,
        market_cap=parsed["market_cap"],
        percent_change_1h=parsed["percent_change_1h"],
        percent_change_24h=parsed["percent_change_24h"],
        percent_change_7d=parsed["percent_change_7d"],
        cmc_rank=parsed["cmc_rank"],
        captured_at=aligned_at,
    )
    db.add(snapshot)
    return True
