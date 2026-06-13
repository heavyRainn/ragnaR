from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.market_data_service import get_last_sync_at, sync_from_coinmarketcap

_last_mock_refresh: datetime | None = None


def get_last_market_sync_at() -> datetime | None:
    """Latest successful market refresh (live CMC sync or mock timestamp bump)."""
    cmc_sync = get_last_sync_at()
    if cmc_sync and _last_mock_refresh:
        return max(cmc_sync, _last_mock_refresh)
    return cmc_sync or _last_mock_refresh


def refresh_market_data(db: Session) -> bool:
    """Refresh market data from CoinMarketCap or bump mock snapshot timestamps."""
    global _last_mock_refresh

    if settings.CMC_API_KEY:
        return sync_from_coinmarketcap(db)

    now = datetime.now(timezone.utc)
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
    _last_mock_refresh = now
    return True
