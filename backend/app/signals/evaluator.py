from app.signals.helpers import (
    compute_price_metrics,
    compute_volume_metrics,
    count_snapshots,
    get_baseline_snapshots,
    get_chronological_snapshots,
    get_latest_snapshot,
)
from app.signals.price_shock import evaluate_price_shock_candidate
from app.signals.quiet_accumulation import evaluate_quiet_accumulation_candidate
from app.signals.volume_shock import evaluate_volume_shock_candidate


def evaluate_asset_candidates(db, asset) -> dict:
    """Evaluate all signal types for an asset. Returns debug-friendly dict."""
    snapshot_count = count_snapshots(db, asset.id)
    latest = get_latest_snapshot(db, asset.id)
    baseline = get_baseline_snapshots(db, asset.id)
    chronological = get_chronological_snapshots(db, asset.id)

    volume_metrics = (
        compute_volume_metrics(latest, baseline, snapshot_count)
        if latest
        else {"volume_ratio": None, "baseline_volume_24h": None, "skip_reason": "no_latest_snapshot"}
    )
    price_metrics = (
        compute_price_metrics(chronological, snapshot_count)
        if latest
        else {
            "current_return": None,
            "baseline_mean_return": None,
            "baseline_std_return": None,
            "price_z_score": None,
            "skip_reason": "no_latest_snapshot",
        }
    )

    volume_candidate = evaluate_volume_shock_candidate(latest, baseline, snapshot_count, volume_metrics)
    price_candidate = evaluate_price_shock_candidate(latest, snapshot_count, price_metrics)
    quiet_candidate = evaluate_quiet_accumulation_candidate(
        latest, snapshot_count, volume_metrics, price_metrics
    )

    return {
        "volume_shock": volume_candidate,
        "price_shock": price_candidate,
        "quiet_accumulation": quiet_candidate,
        "volume_metrics": volume_metrics,
        "price_metrics": price_metrics,
        "snapshot_count": snapshot_count,
        "latest": latest,
    }
