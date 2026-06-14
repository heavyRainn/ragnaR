from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.narrative import NarrativeOut
from app.schemas.signal import SignalOut
from app.schemas.signal_outcome import ReplayQuickIndicesOut


class ReplayPointOut(BaseModel):
    timestamp: datetime
    price: Decimal
    volume_24h: Decimal
    volume_1m: Decimal | None = None
    volume_source: str | None = None
    market_cap: Decimal | None = None
    anomaly_score: int
    signals: list[SignalOut]
    narrative: NarrativeOut


class ReplayOut(BaseModel):
    symbol: str
    points: list[ReplayPointOut]
    snapshot_count: int
    required_snapshot_count: int
    quick_indices: ReplayQuickIndicesOut | None = None
