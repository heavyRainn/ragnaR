from app.models.market_snapshot import MarketSnapshot
from app.signals.common import VOLUME_SHOCK_THRESHOLD, severity_from_score


def compute_volume_shock_score(volume_ratio: float) -> int:
    return min(100, round(max(0, volume_ratio - VOLUME_SHOCK_THRESHOLD) * 20 + 40))


def evaluate_volume_shock_candidate(
    latest: MarketSnapshot | None,
    baseline_snapshots: list[MarketSnapshot],
    snapshot_count: int,
    volume_metrics: dict,
) -> dict:
    if not latest:
        return {"triggered": False, "skip_reason": "no_latest_snapshot"}

    skip = volume_metrics.get("skip_reason")
    ratio = volume_metrics.get("volume_ratio")
    baseline_vol = volume_metrics.get("baseline_volume_24h")

    if skip and ratio is None:
        return {"triggered": False, "skip_reason": skip}

    if ratio is None or ratio < VOLUME_SHOCK_THRESHOLD:
        return {"triggered": False, "skip_reason": skip or "below_threshold"}

    score = compute_volume_shock_score(ratio)
    reason = {
        "current_volume_24h": float(latest.volume_24h),
        "baseline_volume_24h": baseline_vol,
        "volume_ratio": round(ratio, 4),
        "threshold": VOLUME_SHOCK_THRESHOLD,
        "snapshot_count": snapshot_count,
    }

    return {
        "triggered": True,
        "signal_type": "volume_shock",
        "score": score,
        "severity": severity_from_score(score),
        "reason_json": reason,
        "metric_snapshot_json": {
            "price": float(latest.price),
            "volume_24h": float(latest.volume_24h),
            "percent_change_24h": float(latest.percent_change_24h)
            if latest.percent_change_24h is not None
            else None,
        },
        "skip_reason": None,
    }


def evaluate_volume_shock_snapshots(
    latest: MarketSnapshot,
    baseline_snapshots: list[MarketSnapshot],
    snapshot_count: int,
) -> dict | None:
    from app.signals.helpers import compute_volume_metrics

    metrics = compute_volume_metrics(latest, baseline_snapshots, snapshot_count)
    result = evaluate_volume_shock_candidate(latest, baseline_snapshots, snapshot_count, metrics)
    if not result.get("triggered"):
        return None
    return {
        "signal_type": result["signal_type"],
        "score": result["score"],
        "severity": result["severity"],
        "reason_json": result["reason_json"],
    }
