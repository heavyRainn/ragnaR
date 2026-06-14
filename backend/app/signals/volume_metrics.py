from decimal import Decimal

from app.core.config import settings
from app.models.market_snapshot import MarketSnapshot
from app.signals.common import MIN_BASELINE_SNAPSHOTS, MIN_SNAPSHOTS

VOLUME_SOURCE_CMC = "cmc_24h"
VOLUME_SOURCE_BYBIT = "bybit_1m"

# Guard against mixed-unit ratios (e.g. CMC 24h vs Bybit 1m).
MAX_PLAUSIBLE_VOLUME_RATIO = 50.0


def classify_snapshot_volume_source(snapshot: MarketSnapshot) -> str | None:
    if snapshot.volume_source:
        return snapshot.volume_source
    if snapshot.market_cap is None and float(snapshot.volume_24h) > 0:
        return VOLUME_SOURCE_BYBIT
    if float(snapshot.volume_24h) > 0:
        return VOLUME_SOURCE_CMC
    return None


def snapshot_shock_volume(snapshot: MarketSnapshot) -> Decimal | None:
    """Comparable intraday volume for shock detection."""
    if snapshot.volume_1m is not None and float(snapshot.volume_1m) > 0:
        return snapshot.volume_1m

    source = classify_snapshot_volume_source(snapshot)
    if source == VOLUME_SOURCE_BYBIT and float(snapshot.volume_24h) > 0:
        return snapshot.volume_24h

    if settings.is_live_data:
        return None

    if float(snapshot.volume_24h) > 0:
        return snapshot.volume_24h
    return None


def shock_volume_unit() -> str:
    return "1m_turnover" if settings.is_live_data else "volume_24h"


def avg_baseline_shock_volume(baseline_snapshots: list[MarketSnapshot]) -> Decimal | None:
    volumes = [snapshot_shock_volume(s) for s in baseline_snapshots]
    valid = [v for v in volumes if v is not None and float(v) > 0]
    if not valid:
        return None
    return sum(valid) / len(valid)


def count_valid_baseline_volumes(baseline_snapshots: list[MarketSnapshot]) -> int:
    return sum(
        1
        for s in baseline_snapshots
        if snapshot_shock_volume(s) is not None and float(snapshot_shock_volume(s)) > 0
    )


def compute_volume_metrics(
    latest: MarketSnapshot,
    baseline_snapshots: list[MarketSnapshot],
    snapshot_count: int,
) -> dict:
    if snapshot_count < MIN_SNAPSHOTS:
        return {
            "volume_ratio": None,
            "baseline_volume_24h": None,
            "current_volume_24h": None,
            "volume_unit": shock_volume_unit(),
            "skip_reason": f"insufficient_snapshots:{snapshot_count}<{MIN_SNAPSHOTS}",
        }

    if len(baseline_snapshots) < MIN_BASELINE_SNAPSHOTS:
        return {
            "volume_ratio": None,
            "baseline_volume_24h": None,
            "current_volume_24h": None,
            "volume_unit": shock_volume_unit(),
            "skip_reason": f"insufficient_baseline:{len(baseline_snapshots)}<{MIN_BASELINE_SNAPSHOTS}",
        }

    current = snapshot_shock_volume(latest)
    if current is None or float(current) <= 0:
        return {
            "volume_ratio": None,
            "baseline_volume_24h": None,
            "current_volume_24h": None,
            "volume_unit": shock_volume_unit(),
            "skip_reason": "current_volume_unavailable",
        }

    valid_baseline_count = count_valid_baseline_volumes(baseline_snapshots)
    if valid_baseline_count < MIN_BASELINE_SNAPSHOTS:
        return {
            "volume_ratio": None,
            "baseline_volume_24h": None,
            "current_volume_24h": float(current),
            "volume_unit": shock_volume_unit(),
            "skip_reason": f"insufficient_valid_baseline:{valid_baseline_count}<{MIN_BASELINE_SNAPSHOTS}",
        }

    baseline = avg_baseline_shock_volume(baseline_snapshots)
    if baseline is None or float(baseline) <= 0:
        return {
            "volume_ratio": None,
            "baseline_volume_24h": None,
            "current_volume_24h": float(current),
            "volume_unit": shock_volume_unit(),
            "skip_reason": "baseline_volume_invalid",
        }

    ratio = float(current / baseline)
    if ratio > MAX_PLAUSIBLE_VOLUME_RATIO:
        return {
            "volume_ratio": ratio,
            "baseline_volume_24h": float(baseline),
            "current_volume_24h": float(current),
            "volume_unit": shock_volume_unit(),
            "skip_reason": f"implausible_ratio:{ratio:.2f}>{MAX_PLAUSIBLE_VOLUME_RATIO}",
        }

    return {
        "volume_ratio": ratio,
        "baseline_volume_24h": float(baseline),
        "current_volume_24h": float(current),
        "volume_unit": shock_volume_unit(),
        "skip_reason": None,
    }
