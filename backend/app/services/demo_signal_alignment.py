"""Align persisted signal timestamps with replay detection points (mock demo only)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.services.demo_replay_scenarios import DEMO_REPLAY_SYMBOLS
from app.services.replay_service import build_replay_for_asset
from app.services.signal_service import get_active_signals_for_asset

MIN_DEMO_DETECTION_SCORE = 40


def _first_detection_index(points) -> int | None:
    for index, point in enumerate(points):
        if point.anomaly_score >= MIN_DEMO_DETECTION_SCORE and point.signals:
            return index
    return None


def align_demo_signal_timestamps(db: Session) -> None:
    """Set signal.created_at to the replay detection snapshot for demo assets."""
    assets = db.execute(
        select(Asset).where(Asset.symbol.in_(DEMO_REPLAY_SYMBOLS), Asset.is_active.is_(True))
    ).scalars().all()

    for asset in assets:
        points = build_replay_for_asset(db, asset)
        detection_index = _first_detection_index(points)
        if detection_index is None:
            continue

        detection_ts = points[detection_index].timestamp
        active_types = {s.signal_type for s in points[detection_index].signals}

        for signal in get_active_signals_for_asset(db, asset.id):
            if signal.signal_type in active_types:
                signal.created_at = detection_ts

    db.commit()
