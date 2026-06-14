from decimal import Decimal

from pydantic import BaseModel

from app.schemas.asset import AssetOut
from app.schemas.narrative import NarrativeOut


class RadarItemOut(BaseModel):
    asset: AssetOut
    price: Decimal | None
    volume_24h: Decimal | None
    market_cap: Decimal | None
    percent_change_24h: Decimal | None
    anomaly_score: int
    severity: str
    main_signal: str | None
    volume_ratio: float | None
    narrative: NarrativeOut | None = None
    move_after_signal_percent: float | None = None
