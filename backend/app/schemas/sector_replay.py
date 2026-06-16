from datetime import datetime

from pydantic import BaseModel


class SectorReplayPointOut(BaseModel):
    timestamp: datetime
    sector_score: float
    active_signals_count: int
    assets_in_sector: int


class SectorReplayOut(BaseModel):
    sector: str
    points: list[SectorReplayPointOut]
    score_start: float | None = None
    score_end: float | None = None
    score_change: float | None = None
    leader_sector_start: str | None = None
    leader_sector_end: str | None = None
    narrative: str
