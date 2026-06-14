"""Rolling market snapshot window for live mode (1-minute resolution)."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.signals.helpers import get_chronological_snapshots, get_latest_snapshot

logger = logging.getLogger(__name__)

HISTORY_WINDOW_MINUTES = 15


def align_snapshot_timestamp(moment: datetime) -> datetime:
    return moment.astimezone(timezone.utc).replace(second=0, microsecond=0)


def has_snapshot_for_minute(db: Session, asset_id: int, aligned_at: datetime) -> bool:
    latest = get_latest_snapshot(db, asset_id)
    if latest is None:
        return False
    return align_snapshot_timestamp(latest.captured_at) >= aligned_at


def prune_stale_snapshots(db: Session) -> int:
    """Remove market snapshots outside the rolling history window."""
    if not settings.is_live_data:
        return 0

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=HISTORY_WINDOW_MINUTES)
    result = db.execute(delete(MarketSnapshot).where(MarketSnapshot.captured_at < cutoff))
    return int(result.rowcount or 0)


def history_snapshot_limit() -> int:
    return HISTORY_WINDOW_MINUTES if settings.is_live_data else 50


def reconcile_irregular_live_history(db: Session) -> int:
    """Reset assets whose snapshot spacing is not ~1 minute (legacy mixed backfill data)."""
    if not settings.is_live_data:
        return 0

    reset_count = 0
    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()

    for asset in assets:
        chronological = get_chronological_snapshots(db, asset.id, limit=HISTORY_WINDOW_MINUTES + 1)
        if len(chronological) < 2:
            continue

        irregular = len(chronological) > HISTORY_WINDOW_MINUTES + 1
        if not irregular:
            for index in range(1, len(chronological)):
                delta = (
                    chronological[index].captured_at - chronological[index - 1].captured_at
                ).total_seconds()
                if delta < 45 or delta > 90:
                    irregular = True
                    break

        if irregular:
            db.execute(delete(MarketSnapshot).where(MarketSnapshot.asset_id == asset.id))
            asset.history_backfilled = False
            asset.history_backfill_attempted = False
            reset_count += 1

    if reset_count:
        logger.info("Reset irregular snapshot history for %s assets", reset_count)
    return reset_count
