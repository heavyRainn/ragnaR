from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cmc_id: int | None
    symbol: str
    name: str
    slug: str | None
    rank: int | None
    category: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MarketSnapshotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    price: Decimal
    volume_24h: Decimal
    volume_1m: Decimal | None = None
    volume_source: str | None = None
    market_cap: Decimal | None
    percent_change_1h: Decimal | None
    percent_change_24h: Decimal | None
    percent_change_7d: Decimal | None
    cmc_rank: int | None
    captured_at: datetime


from app.schemas.historical_signal import HistoricalSignalOut
from app.schemas.narrative import NarrativeOut
from app.schemas.score import ScoreBreakdownOut
from app.schemas.signal import SignalOut
from app.schemas.signal_outcome import SignalOutcomeOut


class AssetDetailOut(BaseModel):
    asset: AssetOut
    latest_snapshot: MarketSnapshotOut | None
    recent_signals: list[SignalOut]
    signal_timeline: list[SignalOut]
    anomaly_score: int
    score_breakdown: ScoreBreakdownOut
    narrative: NarrativeOut
    snapshot_count: int
    required_snapshot_count: int
    signal_outcome: SignalOutcomeOut | None = None
    historical_signals: list[HistoricalSignalOut] = []


AssetDetailOut.model_rebuild()
