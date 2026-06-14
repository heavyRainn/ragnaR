from datetime import datetime
from decimal import Decimal

from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from app.models.market_snapshot import MarketSnapshot
from app.models.signal import Signal
from app.schemas.replay import ReplayPointOut
from app.schemas.signal_outcome import ReplayQuickIndicesOut, SignalOutcomeOut
from app.services.signal_service import get_active_signals_for_asset, get_signal_timeline

OUTCOME_NEUTRAL_THRESHOLD = 2.0
MIN_SIGNIFICANT_SCORE = 40


def _price_from_signal(signal: Signal) -> Decimal | None:
    metrics = signal.metric_snapshot_json
    if metrics and metrics.get("price") is not None:
        return Decimal(str(metrics["price"]))
    return None


def _snapshot_at_or_before(
    snapshots: list[MarketSnapshot], moment: datetime
) -> MarketSnapshot | None:
    candidates = [s for s in snapshots if s.captured_at <= moment]
    if not candidates:
        return snapshots[0] if snapshots else None
    return max(candidates, key=lambda s: s.captured_at)


def _snapshots_after(snapshots: list[MarketSnapshot], moment: datetime) -> list[MarketSnapshot]:
    return [s for s in snapshots if s.captured_at >= moment]


def _move_percent(from_price: Decimal, to_price: Decimal) -> float:
    base = float(from_price)
    if base <= 0:
        return 0.0
    return round(((float(to_price) - base) / base) * 100, 2)


def _classify_outcome(move_percent: float) -> str:
    if move_percent > OUTCOME_NEUTRAL_THRESHOLD:
        return "Positive"
    if move_percent < -OUTCOME_NEUTRAL_THRESHOLD:
        return "Negative"
    return "Neutral"


def _select_reference_signal(signals: list[Signal]) -> Signal | None:
    if not signals:
        return None

    active = [s for s in signals if s.status == "active"]
    if active:
        return max(active, key=lambda s: (s.score, s.created_at))

    significant = [s for s in signals if s.score >= MIN_SIGNIFICANT_SCORE]
    pool = significant if significant else [s for s in signals if s.score > 0]
    if not pool:
        return None

    return max(pool, key=lambda s: s.created_at)


def compute_move_for_signal(db: Session, signal: Signal) -> float | None:
    snapshots = (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == signal.asset_id)
            .order_by(asc(MarketSnapshot.captured_at))
        )
        .scalars()
        .all()
    )
    if not snapshots:
        return None

    latest = snapshots[-1]
    price_at_signal = _price_from_signal(signal)
    if price_at_signal is None:
        anchor = _snapshot_at_or_before(snapshots, signal.created_at)
        if anchor is None:
            return None
        price_at_signal = anchor.price

    return _move_percent(price_at_signal, latest.price)


def compute_signal_outcome(
    db: Session, asset_id: int, signal: Signal | None = None
) -> SignalOutcomeOut | None:
    timeline = get_signal_timeline(db, asset_id, limit=50)
    reference = signal or _select_reference_signal(timeline)
    if reference is None:
        return None

    snapshots = (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset_id)
            .order_by(asc(MarketSnapshot.captured_at))
        )
        .scalars()
        .all()
    )
    if not snapshots:
        return None

    latest = snapshots[-1]
    price_at_signal = _price_from_signal(reference)
    if price_at_signal is None:
        anchor = _snapshot_at_or_before(snapshots, reference.created_at)
        if anchor is None:
            return None
        price_at_signal = anchor.price

    after_snapshots = _snapshots_after(snapshots, reference.created_at)
    if not after_snapshots:
        after_snapshots = [latest]

    prices_after = [s.price for s in after_snapshots]
    best_price = max(prices_after, key=lambda p: float(p))
    worst_price = min(prices_after, key=lambda p: float(p))

    move_after = _move_percent(price_at_signal, latest.price)
    max_move = _move_percent(price_at_signal, best_price)
    worst_move = _move_percent(price_at_signal, worst_price)

    return SignalOutcomeOut(
        signal_type=reference.signal_type,
        detected_at=reference.created_at,
        signal_score=reference.score,
        current_status=reference.status,
        price_at_signal=price_at_signal,
        current_price=latest.price,
        move_after_signal_percent=move_after,
        best_price_after_signal=best_price,
        worst_price_after_signal=worst_price,
        max_move_after_signal=max_move,
        worst_move_after_signal=worst_move,
        outcome=_classify_outcome(move_after),
    )


def compute_replay_quick_indices(
    points: list[ReplayPointOut],
    signal: Signal | None,
) -> ReplayQuickIndicesOut:
    if not points:
        return ReplayQuickIndicesOut(
            before_signal=None,
            signal_detected=None,
            current_state=None,
        )

    current_state = len(points) - 1
    if signal is None:
        return ReplayQuickIndicesOut(
            before_signal=None,
            signal_detected=None,
            current_state=current_state,
        )

    signal_detected: int | None = None
    sig_time = signal.created_at

    for index, point in enumerate(points):
        if any(s.signal_type == signal.signal_type for s in point.signals):
            signal_detected = index
            break

    if signal_detected is None:
        closest_index = 0
        closest_diff = float("inf")
        for index, point in enumerate(points):
            diff = abs((point.timestamp - sig_time).total_seconds())
            if diff < closest_diff:
                closest_diff = diff
                closest_index = index
        signal_detected = closest_index

    before_signal = signal_detected - 1 if signal_detected > 0 else 0
    if signal_detected == 0:
        before_signal = 0

    return ReplayQuickIndicesOut(
        before_signal=before_signal,
        signal_detected=signal_detected,
        current_state=current_state,
    )


def get_reference_signal_for_asset(db: Session, asset_id: int) -> Signal | None:
    active = get_active_signals_for_asset(db, asset_id)
    if active:
        return max(active, key=lambda s: (s.score, s.created_at))
    timeline = get_signal_timeline(db, asset_id, limit=50)
    return _select_reference_signal(timeline)


def get_move_after_signal_percent(db: Session, asset_id: int) -> float | None:
    outcome = compute_signal_outcome(db, asset_id)
    return outcome.move_after_signal_percent if outcome else None
