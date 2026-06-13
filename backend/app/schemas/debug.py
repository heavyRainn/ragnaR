from pydantic import BaseModel


class SignalDebugOut(BaseModel):
    symbol: str
    snapshot_count: int
    latest_price: float | None
    latest_volume: float | None
    volume_ratio: float | None
    price_return: float | None
    price_z_score: float | None
    volume_triggered: bool
    price_triggered: bool
    quiet_accumulation_triggered: bool
    composite_score: int
    active_signals: list[str]
    skip_reason: str | None
