from pydantic import BaseModel


class SectorRotationOut(BaseModel):
    sector: str
    average_radar_score: float
    average_24h_change: float
    active_signals_count: int
    assets_count: int


class MarketRotationOut(BaseModel):
    leader_sector: str | None
    lagging_sector: str | None
    most_active_sector: str | None
    market_narrative: str
    sectors: list[SectorRotationOut]
