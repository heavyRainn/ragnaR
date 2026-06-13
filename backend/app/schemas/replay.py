from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.narrative import NarrativeOut
from app.schemas.signal import SignalOut


class ReplayPointOut(BaseModel):
    timestamp: datetime
    price: Decimal
    volume_24h: Decimal
    anomaly_score: int
    signals: list[SignalOut]
    narrative: NarrativeOut


class ReplayOut(BaseModel):
    points: list[ReplayPointOut]
    snapshot_count: int
    required_snapshot_count: int
