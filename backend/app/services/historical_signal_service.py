from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from app.models.market_snapshot import MarketSnapshot
from app.models.signal import Signal
from app.schemas.historical_signal import HistoricalSignalOut
from app.services.signal_outcome_service import _move_percent, _price_from_signal, _snapshot_at_or_before
from app.services.signal_service import get_signal_timeline


def _price_at_moment(
    snapshots: list[MarketSnapshot], signal: Signal, moment: datetime
) -> float | None:
    price = _price_from_signal(signal)
    if price is not None:
        return float(price)
    anchor = _snapshot_at_or_before(snapshots, moment)
    if anchor is None:
        return None
    return float(anchor.price)


def build_historical_signals(
    db: Session, asset_id: int, *, limit: int = 100
) -> list[HistoricalSignalOut]:
    signals = get_signal_timeline(db, asset_id, limit=limit)
    if not signals:
        return []

    snapshots = (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset_id)
            .order_by(asc(MarketSnapshot.captured_at))
        )
        .scalars()
        .all()
    )

    now = datetime.now(timezone.utc)
    results: list[HistoricalSignalOut] = []

    for signal in signals:
        detected_at = signal.created_at
        is_resolved = signal.status == "resolved"
        resolved_at = signal.updated_at if is_resolved else None
        end_moment = resolved_at if is_resolved and resolved_at else now

        duration_seconds = max(0, int((end_moment - detected_at).total_seconds()))

        outcome_percent: float | None = None
        if snapshots:
            price_at_signal = _price_at_moment(snapshots, signal, detected_at)
            price_at_end = _price_at_moment(snapshots, signal, end_moment)
            if price_at_end is None and snapshots:
                price_at_end = float(snapshots[-1].price)
            if price_at_signal is not None and price_at_end is not None:
                outcome_percent = _move_percent(
                    Decimal(str(price_at_signal)),
                    Decimal(str(price_at_end)),
                )

        results.append(
            HistoricalSignalOut(
                id=signal.id,
                signal_type=signal.signal_type,
                detected_at=detected_at,
                resolved_at=resolved_at,
                peak_score=signal.score,
                outcome_percent=outcome_percent,
                duration_seconds=duration_seconds,
                status=signal.status,
                reason_json=signal.reason_json,
            )
        )

    return results
