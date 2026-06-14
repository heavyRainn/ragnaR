from datetime import datetime
from typing import Any

from pydantic import BaseModel


class HistoricalSignalOut(BaseModel):
    id: int
    signal_type: str
    detected_at: datetime
    resolved_at: datetime | None
    peak_score: int
    outcome_percent: float | None
    duration_seconds: int
    status: str
    reason_json: dict[str, Any] | None = None
