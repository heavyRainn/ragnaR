from datetime import datetime

from pydantic import BaseModel


class RecentMarketEventOut(BaseModel):
    asset_symbol: str
    asset_name: str
    signal_type: str
    peak_score: int
    status: str
    detected_at: datetime
    move_after_signal_percent: float | None
