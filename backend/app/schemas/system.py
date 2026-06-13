from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class SystemStatusOut(BaseModel):
    data_source: Literal["live", "mock"]
    cmc_api_configured: bool
    cmc_listings_limit: int | None = None
    sync_interval_seconds: int
    last_market_sync_at: datetime | None = None
    message: str
