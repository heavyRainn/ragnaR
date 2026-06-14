from datetime import datetime
from decimal import Decimal

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


class AssetFreshnessOut(BaseModel):
    symbol: str
    latest_snapshot_at: datetime | None
    snapshot_age_seconds: int | None
    snapshot_count: int
    latest_price: Decimal | None
    latest_volume_24h: Decimal | None
    history_backfilled: bool
    history_backfill_attempted: bool
    is_active: bool


class VolumeShockSnapshotDebugOut(BaseModel):
    captured_at: datetime
    price: float
    volume_24h: float
    volume_1m: float | None
    volume_source: str | None
    shock_volume: float | None
    market_cap: float | None


class VolumeShockDebugOut(BaseModel):
    symbol: str
    current_volume: float | None
    baseline_volume: float | None
    ratio: float | None
    snapshot_count: int
    skip_reason: str | None
    volume_unit: str | None
    snapshots: list[VolumeShockSnapshotDebugOut]
