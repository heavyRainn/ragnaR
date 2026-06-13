from decimal import Decimal

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.models.signal import Signal
from app.signals.common import BASELINE_SNAPSHOT_COUNT, severity_from_score
from app.signals.helpers import avg_baseline_volume, compute_volume_ratio

VOLUME_SHOCK_THRESHOLD = 3.0


def compute_volume_shock_score(volume_ratio: float) -> int:
    return min(100, int(volume_ratio / 10 * 100))


def get_baseline_snapshots(db: Session, asset_id: int) -> list[MarketSnapshot]:
    return (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset_id)
            .order_by(desc(MarketSnapshot.captured_at))
            .offset(1)
            .limit(BASELINE_SNAPSHOT_COUNT)
        )
        .scalars()
        .all()
    )


def get_baseline_volume(db: Session, asset_id: int) -> Decimal | None:
    return avg_baseline_volume(get_baseline_snapshots(db, asset_id))


def evaluate_volume_shock(db: Session, asset: Asset) -> Signal | None:
    latest = db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset.id)
        .order_by(desc(MarketSnapshot.captured_at))
        .limit(1)
    ).scalar_one_or_none()

    if not latest:
        return None

    baseline_snapshots = get_baseline_snapshots(db, asset.id)
    volume_ratio = compute_volume_ratio(latest, baseline_snapshots)
    if volume_ratio is None or volume_ratio < VOLUME_SHOCK_THRESHOLD:
        return None

    score = compute_volume_shock_score(volume_ratio)
    severity = severity_from_score(score)
    baseline = avg_baseline_volume(baseline_snapshots)

    reason = {
        "current_volume_24h": float(latest.volume_24h),
        "baseline_volume_24h": float(baseline) if baseline else 0,
        "volume_ratio": round(volume_ratio, 4),
        "threshold": VOLUME_SHOCK_THRESHOLD,
    }

    return Signal(
        asset_id=asset.id,
        signal_type="volume_shock",
        score=score,
        severity=severity,
        status="active",
        reason_json=reason,
        metric_snapshot_json={
            "price": float(latest.price),
            "volume_24h": float(latest.volume_24h),
            "percent_change_24h": float(latest.percent_change_24h)
            if latest.percent_change_24h is not None
            else None,
        },
    )


def evaluate_volume_shock_snapshots(
    latest: MarketSnapshot,
    baseline_snapshots: list[MarketSnapshot],
) -> dict | None:
    volume_ratio = compute_volume_ratio(latest, baseline_snapshots)
    if volume_ratio is None or volume_ratio < VOLUME_SHOCK_THRESHOLD:
        return None

    score = compute_volume_shock_score(volume_ratio)
    baseline = avg_baseline_volume(baseline_snapshots)
    return {
        "signal_type": "volume_shock",
        "score": score,
        "severity": severity_from_score(score),
        "reason_json": {
            "current_volume_24h": float(latest.volume_24h),
            "baseline_volume_24h": float(baseline) if baseline else 0,
            "volume_ratio": round(volume_ratio, 4),
            "threshold": VOLUME_SHOCK_THRESHOLD,
        },
    }
