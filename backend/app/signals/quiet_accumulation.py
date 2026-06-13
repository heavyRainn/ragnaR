from app.models.market_snapshot import MarketSnapshot
from app.signals.common import (
    QUIET_ACCUMULATION_PRICE_FLAT_THRESHOLD,
    QUIET_ACCUMULATION_VOLUME_THRESHOLD,
    severity_from_score,
)
from app.signals.helpers import metric_snapshot_from


def compute_quiet_accumulation_score(volume_ratio: float, percent_change_24h: float) -> int:
    return min(
        100,
        round(
            max(0, volume_ratio - QUIET_ACCUMULATION_VOLUME_THRESHOLD) * 18
            + max(0, QUIET_ACCUMULATION_PRICE_FLAT_THRESHOLD - abs(percent_change_24h)) * 12
            + 40
        ),
    )


def evaluate_quiet_accumulation_candidate(
    latest: MarketSnapshot | None,
    snapshot_count: int,
    volume_metrics: dict,
    price_metrics: dict,
) -> dict:
    if not latest or latest.percent_change_24h is None:
        return {"triggered": False, "skip_reason": "no_percent_change_24h"}

    vol_skip = volume_metrics.get("skip_reason")
    ratio = volume_metrics.get("volume_ratio")
    baseline_vol = volume_metrics.get("baseline_volume_24h")

    if vol_skip and ratio is None:
        return {"triggered": False, "skip_reason": vol_skip}

    if ratio is None or ratio < QUIET_ACCUMULATION_VOLUME_THRESHOLD:
        return {"triggered": False, "skip_reason": vol_skip or "volume_below_threshold"}

    percent_change = float(latest.percent_change_24h)
    if abs(percent_change) > QUIET_ACCUMULATION_PRICE_FLAT_THRESHOLD:
        return {"triggered": False, "skip_reason": "price_not_flat"}

    score = compute_quiet_accumulation_score(ratio, percent_change)
    reason = {
        "volume_ratio": round(ratio, 4),
        "percent_change_24h": round(percent_change, 4),
        "volume_threshold": QUIET_ACCUMULATION_VOLUME_THRESHOLD,
        "price_flat_threshold": QUIET_ACCUMULATION_PRICE_FLAT_THRESHOLD,
        "baseline_volume_24h": baseline_vol,
        "current_volume_24h": float(latest.volume_24h),
        "snapshot_count": snapshot_count,
    }

    return {
        "triggered": True,
        "signal_type": "quiet_accumulation",
        "score": score,
        "severity": severity_from_score(score),
        "reason_json": reason,
        "metric_snapshot_json": metric_snapshot_from(latest),
        "skip_reason": None,
    }


def evaluate_quiet_accumulation_snapshots(
    latest: MarketSnapshot,
    baseline_snapshots: list[MarketSnapshot],
    snapshot_count: int,
) -> dict | None:
    from app.signals.helpers import compute_volume_metrics

    metrics = compute_volume_metrics(latest, baseline_snapshots, snapshot_count)
    result = evaluate_quiet_accumulation_candidate(latest, snapshot_count, metrics, {})
    if not result.get("triggered"):
        return None
    return {
        "signal_type": result["signal_type"],
        "score": result["score"],
        "severity": result["severity"],
        "reason_json": result["reason_json"],
    }
