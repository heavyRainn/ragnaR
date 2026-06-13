from app.models.market_snapshot import MarketSnapshot
from app.signals.common import PRICE_SHOCK_THRESHOLD, severity_from_score
from app.signals.helpers import metric_snapshot_from


def compute_price_shock_score(price_z_score: float) -> int:
    return min(100, round(max(0, abs(price_z_score) - PRICE_SHOCK_THRESHOLD) * 20 + 40))


def evaluate_price_shock_candidate(
    latest: MarketSnapshot | None,
    snapshot_count: int,
    price_metrics: dict,
) -> dict:
    if not latest:
        return {"triggered": False, "skip_reason": "no_latest_snapshot"}

    skip = price_metrics.get("skip_reason")
    z_score = price_metrics.get("price_z_score")

    if skip and z_score is None:
        return {"triggered": False, "skip_reason": skip}

    if z_score is None or abs(z_score) < PRICE_SHOCK_THRESHOLD:
        return {"triggered": False, "skip_reason": skip or "below_threshold"}

    current_return = price_metrics["current_return"]
    mean_return = price_metrics["baseline_mean_return"]
    std_return = price_metrics["baseline_std_return"]

    score = compute_price_shock_score(z_score)
    reason = {
        "current_return": round(current_return, 6),
        "baseline_mean_return": round(mean_return, 6),
        "baseline_std_return": round(std_return, 6),
        "price_z_score": round(z_score, 4),
        "threshold": PRICE_SHOCK_THRESHOLD,
        "snapshot_count": snapshot_count,
    }

    return {
        "triggered": True,
        "signal_type": "price_shock",
        "score": score,
        "severity": severity_from_score(score),
        "reason_json": reason,
        "metric_snapshot_json": metric_snapshot_from(latest),
        "skip_reason": None,
    }


def evaluate_price_shock_snapshots(
    latest: MarketSnapshot,
    baseline_snapshots: list[MarketSnapshot],
    snapshot_count: int,
) -> dict | None:
    from app.signals.helpers import compute_price_metrics

    chronological = baseline_snapshots + [latest]
    metrics = compute_price_metrics(chronological, snapshot_count)
    result = evaluate_price_shock_candidate(latest, snapshot_count, metrics)
    if not result.get("triggered"):
        return None
    return {
        "signal_type": result["signal_type"],
        "score": result["score"],
        "severity": result["severity"],
        "reason_json": result["reason_json"],
    }
