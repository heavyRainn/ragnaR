from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.models.signal import Signal
from app.signals.common import BASELINE_SNAPSHOT_COUNT, severity_from_score
from app.signals.helpers import compute_volume_ratio
from app.signals.volume_shock import get_baseline_snapshots

VOLUME_THRESHOLD = 3.0
PRICE_FLAT_THRESHOLD = 2.0


def compute_quiet_accumulation_score(volume_ratio: float, percent_change_24h: float) -> int:
    stability_bonus = max(0, 20 - abs(percent_change_24h) * 5)
    return min(100, int(volume_ratio * 15 + stability_bonus))


def evaluate_quiet_accumulation(db: Session, asset: Asset) -> Signal | None:
    latest = db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset.id)
        .order_by(desc(MarketSnapshot.captured_at))
        .limit(1)
    ).scalar_one_or_none()

    if not latest or latest.percent_change_24h is None:
        return None

    baseline_snapshots = get_baseline_snapshots(db, asset.id)
    volume_ratio = compute_volume_ratio(latest, baseline_snapshots)
    if volume_ratio is None or volume_ratio < VOLUME_THRESHOLD:
        return None

    percent_change = float(latest.percent_change_24h)
    if abs(percent_change) > PRICE_FLAT_THRESHOLD:
        return None

    score = compute_quiet_accumulation_score(volume_ratio, percent_change)
    severity = severity_from_score(score)

    reason = {
        "volume_ratio": round(volume_ratio, 4),
        "percent_change_24h": round(percent_change, 4),
        "volume_threshold": VOLUME_THRESHOLD,
        "price_flat_threshold": PRICE_FLAT_THRESHOLD,
    }

    return Signal(
        asset_id=asset.id,
        signal_type="quiet_accumulation",
        score=score,
        severity=severity,
        status="active",
        reason_json=reason,
        metric_snapshot_json={
            "price": float(latest.price),
            "volume_24h": float(latest.volume_24h),
            "percent_change_24h": percent_change,
        },
    )


def evaluate_quiet_accumulation_snapshots(
    latest: MarketSnapshot,
    baseline_snapshots: list[MarketSnapshot],
) -> dict | None:
    if latest.percent_change_24h is None:
        return None

    volume_ratio = compute_volume_ratio(latest, baseline_snapshots)
    if volume_ratio is None or volume_ratio < VOLUME_THRESHOLD:
        return None

    percent_change = float(latest.percent_change_24h)
    if abs(percent_change) > PRICE_FLAT_THRESHOLD:
        return None

    score = compute_quiet_accumulation_score(volume_ratio, percent_change)
    return {
        "signal_type": "quiet_accumulation",
        "score": score,
        "severity": severity_from_score(score),
        "reason_json": {
            "volume_ratio": round(volume_ratio, 4),
            "percent_change_24h": round(percent_change, 4),
            "volume_threshold": VOLUME_THRESHOLD,
            "price_flat_threshold": PRICE_FLAT_THRESHOLD,
        },
    }
