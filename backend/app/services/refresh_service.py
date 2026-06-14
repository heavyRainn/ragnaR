import logging
from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.market_data_service import get_last_sync_at, sync_from_coinmarketcap
from app.services.signal_service import refresh_signals
from app.services.sync_state import sync_state

logger = logging.getLogger(__name__)


def get_last_market_sync_at() -> datetime | None:
    return get_last_sync_at()


def refresh_market_data(db: Session, *, force: bool = False) -> bool:
    """Refresh market data from CoinMarketCap (live) or append mock snapshots."""
    if settings.is_live_data:
        return sync_from_coinmarketcap(db, force=force)

    sync_state.mark_started("mock")
    logger.info("Mock sync started")

    now = datetime.now(timezone.utc)
    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()
    inserted = 0

    for asset in assets:
        latest = db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
            .order_by(desc(MarketSnapshot.captured_at))
            .limit(1)
        ).scalar_one_or_none()
        if not latest:
            continue

        db.add(
            MarketSnapshot(
                asset_id=asset.id,
                price=latest.price,
                volume_24h=latest.volume_24h,
                market_cap=latest.market_cap,
                percent_change_1h=latest.percent_change_1h,
                percent_change_24h=latest.percent_change_24h,
                percent_change_7d=latest.percent_change_7d,
                cmc_rank=latest.cmc_rank,
                captured_at=now,
            )
        )
        inserted += 1

    db.commit()
    touched = refresh_signals(db)

    sync_state.mark_success(
        snapshots_inserted=inserted,
        assets_count=len(assets),
        signals_refreshed=len(touched),
    )
    logger.info(
        "Mock sync completed: assets=%s snapshots_inserted=%s signals_refreshed=%s",
        len(assets),
        inserted,
        len(touched),
    )
    return True
