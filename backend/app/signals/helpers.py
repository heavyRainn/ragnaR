from decimal import Decimal

from app.models.market_snapshot import MarketSnapshot


def avg_baseline_volume(baseline_snapshots: list[MarketSnapshot]) -> Decimal | None:
    if not baseline_snapshots:
        return None
    total = sum(s.volume_24h for s in baseline_snapshots)
    return total / len(baseline_snapshots)


def compute_volume_ratio(latest: MarketSnapshot, baseline_snapshots: list[MarketSnapshot]) -> float | None:
    baseline = avg_baseline_volume(baseline_snapshots)
    if not baseline or baseline == 0:
        return None
    return float(latest.volume_24h / baseline)
