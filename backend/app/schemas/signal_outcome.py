from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class SignalOutcomeOut(BaseModel):
    signal_type: str
    detected_at: datetime
    signal_score: int
    current_status: str
    price_at_signal: Decimal
    current_price: Decimal
    move_after_signal_percent: float
    best_price_after_signal: Decimal
    worst_price_after_signal: Decimal
    max_move_after_signal: float
    worst_move_after_signal: float
    outcome: str  # Positive | Negative | Neutral


class ReplayQuickIndicesOut(BaseModel):
    before_signal: int | None
    signal_detected: int | None
    current_state: int | None
