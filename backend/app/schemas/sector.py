from pydantic import BaseModel

from app.schemas.asset import AssetOut
from app.schemas.signal import SignalOut


class SectorAssetOut(BaseModel):
    asset: AssetOut
    anomaly_score: int
    main_signal: str | None = None


class SectorDetailOut(BaseModel):
    sector: str
    radar_score: float
    average_score: float
    active_signals_count: int
    assets_count: int
    average_24h_change: float
    narrative: str
    top_assets: list[SectorAssetOut]
    active_signals: list[SignalOut]
    is_market_leader: bool = False
