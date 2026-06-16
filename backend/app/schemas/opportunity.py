from datetime import datetime

from pydantic import BaseModel


class OpportunityFeedItemOut(BaseModel):
    id: int
    asset_symbol: str
    asset_name: str
    sector: str | None
    signal_type: str
    score: int
    severity: str
    status: str
    detected_at: datetime
