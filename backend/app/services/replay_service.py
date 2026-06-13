from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.replay import ReplayPointOut
from app.schemas.signal import SignalOut
from app.services.narrative_service import classify_narrative_from_types, signal_feed_description
from app.signals.composite_score import compute_composite_from_components
from app.signals.price_shock import evaluate_price_shock_snapshots
from app.signals.quiet_accumulation import evaluate_quiet_accumulation_snapshots
from app.signals.volume_shock import evaluate_volume_shock_snapshots


def _mock_signal_for_feed(result: dict, asset_id: int, captured_at) -> SignalOut:
    from app.models.signal import Signal

    mock = Signal(
        id=0,
        asset_id=asset_id,
        signal_type=result["signal_type"],
        score=result["score"],
        severity=result["severity"],
        status="active",
        reason_json=result["reason_json"],
        metric_snapshot_json=None,
        created_at=captured_at,
    )
    return SignalOut(
        id=0,
        asset_id=asset_id,
        signal_type=result["signal_type"],
        score=result["score"],
        severity=result["severity"],
        status="active",
        reason_json=result["reason_json"],
        metric_snapshot_json=None,
        created_at=captured_at,
        feed_description=signal_feed_description(mock),
    )


def build_replay_for_asset(db: Session, asset: Asset) -> list[ReplayPointOut]:
    snapshots = (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
            .order_by(asc(MarketSnapshot.captured_at))
        )
        .scalars()
        .all()
    )

    points: list[ReplayPointOut] = []

    for index, latest in enumerate(snapshots):
        baseline = snapshots[max(0, index - 5) : index]
        if not baseline:
            points.append(
                ReplayPointOut(
                    timestamp=latest.captured_at,
                    price=latest.price,
                    volume_24h=latest.volume_24h,
                    anomaly_score=0,
                    signals=[],
                    narrative=classify_narrative_from_types(set()),
                )
            )
            continue

        triggered: list[SignalOut] = []
        signal_types: set[str] = set()
        components = {"volume": 0, "price": 0, "quiet_accumulation": 0}

        evaluators = [
            (evaluate_volume_shock_snapshots, "volume"),
            (evaluate_price_shock_snapshots, "price"),
            (evaluate_quiet_accumulation_snapshots, "quiet_accumulation"),
        ]

        for evaluator, component_key in evaluators:
            result = evaluator(latest, baseline)
            if result:
                components[component_key] = result["score"]
                signal_types.add(result["signal_type"])
                triggered.append(_mock_signal_for_feed(result, asset.id, latest.captured_at))

        anomaly_score = compute_composite_from_components(components)

        points.append(
            ReplayPointOut(
                timestamp=latest.captured_at,
                price=latest.price,
                volume_24h=latest.volume_24h,
                anomaly_score=anomaly_score,
                signals=triggered,
                narrative=classify_narrative_from_types(signal_types),
            )
        )

    return points
