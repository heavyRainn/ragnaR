from fastapi import APIRouter

from app.core.config import settings
from app.schemas.system import SystemStatusOut
from app.services.refresh_service import get_last_market_sync_at

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/status", response_model=SystemStatusOut)
def get_system_status() -> SystemStatusOut:
    cmc_configured = bool(settings.CMC_API_KEY and settings.CMC_API_KEY.strip())
    limit = settings.CMC_LISTINGS_LIMIT
    interval = settings.cmc_sync_interval
    last_sync = get_last_market_sync_at()

    if cmc_configured:
        return SystemStatusOut(
            data_source="live",
            cmc_api_configured=True,
            cmc_listings_limit=limit,
            sync_interval_seconds=interval,
            last_market_sync_at=last_sync,
            message=(
                f"CoinMarketCap live — top {limit}, "
                f"1 batch request every {interval}s (~{86400 // interval} calls/day)"
            ),
        )

    return SystemStatusOut(
        data_source="mock",
        cmc_api_configured=False,
        cmc_listings_limit=None,
        sync_interval_seconds=interval,
        last_market_sync_at=last_sync,
        message=f"Seeded mock data — refreshed every {interval}s",
    )
