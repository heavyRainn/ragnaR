from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SignalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    signal_type: str
    score: int
    severity: str
    status: str
    reason_json: dict[str, Any]
    metric_snapshot_json: dict[str, Any] | None
    created_at: datetime
    asset_symbol: str | None = None
    asset_name: str | None = None
    feed_description: str | None = None
