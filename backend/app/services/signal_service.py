from datetime import datetime, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.signal import Signal
from app.signals.common import severity_from_score
from app.signals.composite_score import compute_composite_score
from app.signals.evaluator import evaluate_asset_candidates

SIGNAL_TYPES = ("volume_shock", "price_shock", "quiet_accumulation")


def _get_active_signal(db: Session, asset_id: int, signal_type: str) -> Signal | None:
    return db.execute(
        select(Signal)
        .where(
            Signal.asset_id == asset_id,
            Signal.signal_type == signal_type,
            Signal.status == "active",
        )
        .order_by(desc(Signal.created_at))
        .limit(1)
    ).scalar_one_or_none()


def resolve_active_signals_for_asset(db: Session, asset_id: int) -> None:
    now = datetime.now(timezone.utc)
    active = db.execute(
        select(Signal).where(Signal.asset_id == asset_id, Signal.status == "active")
    ).scalars().all()
    for signal in active:
        signal.status = "resolved"
        signal.updated_at = now


def refresh_signals(db: Session) -> list[Signal]:
    now = datetime.now(timezone.utc)
    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()
    touched: list[Signal] = []

    for asset in assets:
        evaluation = evaluate_asset_candidates(db, asset)

        for signal_type in SIGNAL_TYPES:
            candidate = evaluation[signal_type]
            existing = _get_active_signal(db, asset.id, signal_type)

            if candidate.get("triggered"):
                if existing:
                    existing.score = candidate["score"]
                    existing.severity = candidate["severity"]
                    existing.reason_json = candidate["reason_json"]
                    existing.metric_snapshot_json = candidate.get("metric_snapshot_json")
                    existing.updated_at = now
                    touched.append(existing)
                else:
                    signal = Signal(
                        asset_id=asset.id,
                        signal_type=signal_type,
                        score=candidate["score"],
                        severity=candidate["severity"],
                        status="active",
                        reason_json=candidate["reason_json"],
                        metric_snapshot_json=candidate.get("metric_snapshot_json"),
                        created_at=now,
                        updated_at=now,
                    )
                    db.add(signal)
                    touched.append(signal)
            elif existing:
                existing.status = "resolved"
                existing.updated_at = now
                touched.append(existing)

    db.commit()
    return touched


def get_active_signals_for_asset(db: Session, asset_id: int) -> list[Signal]:
    return (
        db.execute(
            select(Signal)
            .where(Signal.asset_id == asset_id, Signal.status == "active")
            .order_by(desc(Signal.score), desc(Signal.created_at))
        )
        .scalars()
        .all()
    )


def get_signal_timeline(db: Session, asset_id: int, limit: int = 20) -> list[Signal]:
    return (
        db.execute(
            select(Signal)
            .where(Signal.asset_id == asset_id)
            .order_by(desc(Signal.updated_at), desc(Signal.created_at))
            .limit(limit)
        )
        .scalars()
        .all()
    )


def get_top_signal_for_asset(db: Session, asset_id: int) -> Signal | None:
    active = get_active_signals_for_asset(db, asset_id)
    if not active:
        return None
    return max(active, key=lambda s: s.score)


def get_score_breakdown(db: Session, asset_id: int) -> tuple[int, dict[str, int]]:
    active = get_active_signals_for_asset(db, asset_id)
    return compute_composite_score(active)


def get_anomaly_score(db: Session, asset_id: int) -> int:
    total, _ = get_score_breakdown(db, asset_id)
    return total


def get_composite_severity(db: Session, asset_id: int) -> str:
    score = get_anomaly_score(db, asset_id)
    return severity_from_score(score)


def extract_volume_ratio(active_signals: list[Signal]) -> float | None:
    for signal in active_signals:
        if signal.status != "active":
            continue
        ratio = signal.reason_json.get("volume_ratio")
        if ratio is not None:
            return float(ratio)
    return None
