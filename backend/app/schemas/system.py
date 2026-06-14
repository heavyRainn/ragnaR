from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel


class SystemStatusOut(BaseModel):
    data_source: Literal["live", "mock"]
    cmc_api_configured: bool
    cmc_listings_limit: int | None = None
    sync_interval_seconds: int
    last_market_sync_at: datetime | None = None
    last_sync_started_at: datetime | None = None
    last_sync_finished_at: datetime | None = None
    last_sync_status: Literal["idle", "running", "success", "failed", "skipped"] = "idle"
    last_sync_error: str | None = None
    last_successful_sync_at: datetime | None = None
    last_cmc_assets_count: int = 0
    last_snapshots_inserted: int = 0
    last_signals_refreshed: int = 0
    next_sync_in_seconds: int = 0
    scheduler_running: bool = False
    message: str
