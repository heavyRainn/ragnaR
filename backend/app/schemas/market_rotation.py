from pydantic import BaseModel


class SectorRotationOut(BaseModel):
    sector: str
    average_radar_score: float
    average_24h_change: float
    average_1h_change: float
    active_signals_count: int
    assets_count: int
    trend: str


class MarketRotationOut(BaseModel):
    leader_sector: str | None
    lagging_sector: str | None
    most_active_sector: str | None
    strongest_sector: str | None
    weakest_sector: str | None
    best_1h_sector: str | None
    worst_1h_sector: str | None
    market_narrative: str
    sectors: list[SectorRotationOut]
