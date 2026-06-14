import statistics
from decimal import Decimal

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.market_snapshot import MarketSnapshot
from app.signals.common import MAX_STEP_RETURN, MIN_BASELINE_SNAPSHOTS, MIN_SNAPSHOTS
from app.signals.volume_metrics import (
    avg_baseline_shock_volume as avg_baseline_volume,
    compute_volume_metrics,
    snapshot_shock_volume,
)

SignalCandidateResult = dict | None


def count_snapshots(db: Session, asset_id: int) -> int:
    return db.execute(
        select(func.count())
        .select_from(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset_id)
    ).scalar_one()


def get_latest_snapshot(db: Session, asset_id: int) -> MarketSnapshot | None:
    return db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset_id)
        .order_by(desc(MarketSnapshot.captured_at))
        .limit(1)
    ).scalar_one_or_none()


def get_baseline_snapshots(db: Session, asset_id: int) -> list[MarketSnapshot]:
    """Previous snapshots only — excludes the latest."""
    return (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset_id)
            .order_by(desc(MarketSnapshot.captured_at))
            .offset(1)
            .limit(MIN_BASELINE_SNAPSHOTS)
        )
        .scalars()
        .all()
    )


def get_chronological_snapshots(db: Session, asset_id: int, limit: int = 25) -> list[MarketSnapshot]:
    rows = (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset_id)
            .order_by(desc(MarketSnapshot.captured_at))
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return list(reversed(rows))


def compute_volume_ratio(latest: MarketSnapshot, baseline_snapshots: list[MarketSnapshot]) -> float | None:
    current = snapshot_shock_volume(latest)
    if current is None or float(current) <= 0:
        return None
    baseline = avg_baseline_volume(baseline_snapshots)
    if baseline is None or float(baseline) <= 0:
        return None
    return float(current / baseline)


def compute_returns_from_prices(snapshots: list[MarketSnapshot]) -> list[float]:
    returns: list[float] = []
    for i in range(1, len(snapshots)):
        prev = float(snapshots[i - 1].price)
        curr = float(snapshots[i].price)
        if prev <= 0:
            continue
        returns.append((curr - prev) / prev)
    return returns


def has_sufficient_history(snapshot_count: int, baseline_count: int) -> bool:
    return snapshot_count >= MIN_SNAPSHOTS and baseline_count >= MIN_BASELINE_SNAPSHOTS


def metric_snapshot_from(latest: MarketSnapshot) -> dict:
    return {
        "price": float(latest.price),
        "volume_24h": float(latest.volume_24h),
        "percent_change_24h": float(latest.percent_change_24h)
        if latest.percent_change_24h is not None
        else None,
    }


def compute_price_metrics(
    chronological: list[MarketSnapshot],
    snapshot_count: int,
) -> dict:
    from app.signals.common import MIN_BASELINE_RETURNS, MIN_STD_RETURN, PRICE_SHOCK_THRESHOLD

    if snapshot_count < MIN_SNAPSHOTS:
        return {
            "current_return": None,
            "baseline_mean_return": None,
            "baseline_std_return": None,
            "price_z_score": None,
            "skip_reason": f"insufficient_snapshots:{snapshot_count}<{MIN_SNAPSHOTS}",
        }

    returns = compute_returns_from_prices(chronological)
    if len(returns) < MIN_BASELINE_RETURNS + 1:
        return {
            "current_return": None,
            "baseline_mean_return": None,
            "baseline_std_return": None,
            "price_z_score": None,
            "skip_reason": f"insufficient_returns:{len(returns)}<{MIN_BASELINE_RETURNS + 1}",
        }

    current_return = returns[-1]
    if abs(current_return) > MAX_STEP_RETURN:
        return {
            "current_return": current_return,
            "baseline_mean_return": None,
            "baseline_std_return": None,
            "price_z_score": None,
            "skip_reason": f"abnormal_step_return:{current_return:.4f}>{MAX_STEP_RETURN}",
        }

    baseline_returns = returns[:-1][-MIN_BASELINE_RETURNS:]

    if len(baseline_returns) < MIN_BASELINE_RETURNS:
        return {
            "current_return": None,
            "baseline_mean_return": None,
            "baseline_std_return": None,
            "price_z_score": None,
            "skip_reason": f"insufficient_baseline_returns:{len(baseline_returns)}",
        }

    mean_return = statistics.mean(baseline_returns)
    std_return = statistics.pstdev(baseline_returns)

    if std_return < MIN_STD_RETURN:
        return {
            "current_return": current_return,
            "baseline_mean_return": mean_return,
            "baseline_std_return": std_return,
            "price_z_score": None,
            "skip_reason": f"baseline_std_too_low:{std_return:.6f}<{MIN_STD_RETURN}",
        }

    z_score = (current_return - mean_return) / std_return
    return {
        "current_return": current_return,
        "baseline_mean_return": mean_return,
        "baseline_std_return": std_return,
        "price_z_score": z_score,
        "skip_reason": None if abs(z_score) >= PRICE_SHOCK_THRESHOLD else "below_threshold",
    }
