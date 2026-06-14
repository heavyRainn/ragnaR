from fastapi import APIRouter

from app.core.config import settings
from app.schemas.system import SystemStatusOut
from app.services.sync_state import sync_state

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/status", response_model=SystemStatusOut)
def get_system_status() -> SystemStatusOut:
    interval = settings.cmc_sync_interval
    limit = settings.CMC_LISTINGS_LIMIT
    is_live = settings.is_live_data

    if is_live:
        message = (
            f"CoinMarketCap live — top {limit}, "
            f"1 batch request every {interval}s (~{86400 // interval} calls/day)"
        )
    else:
        message = f"Seeded mock data — new snapshot appended every {interval}s"

    if sync_state.last_sync_status == "failed" and sync_state.last_sync_error:
        message = f"Last sync failed: {sync_state.last_sync_error}"

    return SystemStatusOut(
        data_source="live" if is_live else "mock",
        cmc_api_configured=is_live,
        cmc_listings_limit=limit if is_live else None,
        sync_interval_seconds=interval,
        last_market_sync_at=sync_state.last_successful_sync_at,
        last_sync_started_at=sync_state.last_sync_started_at,
        last_sync_finished_at=sync_state.last_sync_finished_at,
        last_sync_status=sync_state.last_sync_status,
        last_sync_error=sync_state.last_sync_error,
        last_successful_sync_at=sync_state.last_successful_sync_at,
        last_cmc_assets_count=sync_state.last_cmc_assets_count,
        last_snapshots_inserted=sync_state.last_snapshots_inserted,
        last_signals_refreshed=sync_state.last_signals_refreshed,
        next_sync_in_seconds=sync_state.next_sync_in_seconds(interval),
        scheduler_running=sync_state.scheduler_running,
        message=message,
    )
