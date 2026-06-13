import statistics

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.models.signal import Signal
from app.signals.common import (
    BASELINE_SNAPSHOT_COUNT,
    MIN_BASELINE_SNAPSHOTS,
    severity_from_score,
)

PRICE_SHOCK_THRESHOLD = 2.0


def compute_price_shock_score(price_z_score: float) -> int:
    return min(100, int(abs(price_z_score) / 5 * 100))


def get_return_baseline_from_snapshots(
    baseline_snapshots: list[MarketSnapshot],
) -> tuple[float, float] | None:
    returns = [
        float(s.percent_change_24h)
        for s in baseline_snapshots
        if s.percent_change_24h is not None
    ]

    if len(returns) < MIN_BASELINE_SNAPSHOTS:
        return None

    mean_return = statistics.mean(returns)
    std_return = statistics.pstdev(returns)

    if std_return == 0:
        return None

    return mean_return, std_return


def get_return_baseline(db: Session, asset_id: int) -> tuple[float, float] | None:
    snapshots = (
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
    return get_return_baseline_from_snapshots(snapshots)


def evaluate_price_shock(db: Session, asset: Asset) -> Signal | None:
    latest = db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset.id)
        .order_by(desc(MarketSnapshot.captured_at))
        .limit(1)
    ).scalar_one_or_none()

    if not latest or latest.percent_change_24h is None:
        return None

    baseline = get_return_baseline(db, asset.id)
    if baseline is None:
        return None

    mean_return, std_return = baseline
    current_return = float(latest.percent_change_24h)
    price_z_score = (current_return - mean_return) / std_return

    if abs(price_z_score) < PRICE_SHOCK_THRESHOLD:
        return None

    score = compute_price_shock_score(price_z_score)
    severity = severity_from_score(score)

    reason = {
        "current_return_24h": round(current_return, 4),
        "mean_return_baseline": round(mean_return, 4),
        "std_return_baseline": round(std_return, 4),
        "price_z_score": round(price_z_score, 4),
        "threshold": PRICE_SHOCK_THRESHOLD,
    }

    return Signal(
        asset_id=asset.id,
        signal_type="price_shock",
        score=score,
        severity=severity,
        status="active",
        reason_json=reason,
        metric_snapshot_json={
            "price": float(latest.price),
            "volume_24h": float(latest.volume_24h),
            "percent_change_24h": current_return,
        },
    )


def evaluate_price_shock_snapshots(
    latest: MarketSnapshot,
    baseline_snapshots: list[MarketSnapshot],
) -> dict | None:
    if latest.percent_change_24h is None:
        return None

    baseline = get_return_baseline_from_snapshots(baseline_snapshots)
    if baseline is None:
        return None

    mean_return, std_return = baseline
    current_return = float(latest.percent_change_24h)
    price_z_score = (current_return - mean_return) / std_return

    if abs(price_z_score) < PRICE_SHOCK_THRESHOLD:
        return None

    score = compute_price_shock_score(price_z_score)
    return {
        "signal_type": "price_shock",
        "score": score,
        "severity": severity_from_score(score),
        "reason_json": {
            "current_return_24h": round(current_return, 4),
            "mean_return_baseline": round(mean_return, 4),
            "std_return_baseline": round(std_return, 4),
            "price_z_score": round(price_z_score, 4),
            "threshold": PRICE_SHOCK_THRESHOLD,
        },
    }
