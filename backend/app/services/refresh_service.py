from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.market_data_service import sync_from_coinmarketcap

_last_refresh: datetime | None = None


def refresh_market_data(db: Session) -> None:
    """Refresh market data from CoinMarketCap when configured, otherwise bump mock timestamps."""
    global _last_refresh

    if settings.CMC_API_KEY:
        sync_from_coinmarketcap(db)
        return

    now = datetime.now(timezone.utc)
    interval = settings.CMC_REFRESH_INTERVAL_SECONDS

    if _last_refresh and (now - _last_refresh).total_seconds() < interval:
        return

    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()
    for asset in assets:
        latest = db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
            .order_by(desc(MarketSnapshot.captured_at))
            .limit(1)
        ).scalar_one_or_none()
        if latest:
            latest.captured_at = now

    db.commit()
    _last_refresh = now
