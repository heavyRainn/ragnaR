from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.signal import Signal
from app.signals.common import severity_from_score
from app.signals.composite_score import compute_composite_score
from app.signals.price_shock import evaluate_price_shock
from app.signals.quiet_accumulation import evaluate_quiet_accumulation
from app.signals.volume_shock import evaluate_volume_shock


def evaluate_asset_signals(db: Session, asset: Asset) -> list[Signal]:
    signals: list[Signal] = []

    volume_signal = evaluate_volume_shock(db, asset)
    if volume_signal:
        signals.append(volume_signal)

    price_signal = evaluate_price_shock(db, asset)
    if price_signal:
        signals.append(price_signal)

    quiet_signal = evaluate_quiet_accumulation(db, asset)
    if quiet_signal:
        signals.append(quiet_signal)

    return signals


def refresh_signals(db: Session) -> list[Signal]:
    db.execute(
        Signal.__table__.update()
        .where(Signal.status == "active")
        .values(status="superseded")
    )

    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()
    new_signals: list[Signal] = []

    for asset in assets:
        for signal in evaluate_asset_signals(db, asset):
            db.add(signal)
            new_signals.append(signal)

    db.commit()
    return new_signals


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
            .order_by(desc(Signal.created_at))
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
    total, components = compute_composite_score(active)
    return total, components


def get_anomaly_score(db: Session, asset_id: int) -> int:
    total, _ = get_score_breakdown(db, asset_id)
    return total


def get_composite_severity(db: Session, asset_id: int) -> str:
    score = get_anomaly_score(db, asset_id)
    return severity_from_score(score)


def extract_volume_ratio(active_signals: list[Signal]) -> float | None:
    for signal in active_signals:
        ratio = signal.reason_json.get("volume_ratio")
        if ratio is not None:
            return float(ratio)
    return None
