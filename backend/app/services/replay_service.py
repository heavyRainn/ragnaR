from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.replay import ReplayPointOut
from app.schemas.signal import SignalOut
from app.services.narrative_service import classify_narrative_from_types, signal_feed_description
from app.signals.composite_score import compute_composite_from_components
from app.signals.helpers import compute_price_metrics, compute_volume_metrics
from app.signals.price_shock import evaluate_price_shock_candidate
from app.signals.quiet_accumulation import evaluate_quiet_accumulation_candidate
from app.signals.volume_shock import evaluate_volume_shock_candidate


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
        updated_at=captured_at,
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
        updated_at=captured_at,
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

    for index in range(len(snapshots)):
        latest = snapshots[index]
        chronological = snapshots[: index + 1]
        snapshot_count = len(chronological)
        baseline = chronological[:-1]
        baseline_window = baseline[-20:] if len(baseline) > 20 else baseline

        volume_metrics = compute_volume_metrics(latest, baseline_window, snapshot_count)
        price_metrics = compute_price_metrics(chronological, snapshot_count)

        triggered: list[SignalOut] = []
        signal_types: set[str] = set()
        components: dict[str, int] = {}

        evaluators = [
            (
                evaluate_volume_shock_candidate(
                    latest, baseline_window, snapshot_count, volume_metrics
                ),
                "volume",
            ),
            (
                evaluate_price_shock_candidate(latest, snapshot_count, price_metrics),
                "price",
            ),
            (
                evaluate_quiet_accumulation_candidate(
                    latest, snapshot_count, volume_metrics, price_metrics
                ),
                "quiet_accumulation",
            ),
        ]

        for result, component_key in evaluators:
            if result.get("triggered"):
                components[component_key] = result["score"]
                signal_types.add(result["signal_type"])
                triggered.append(
                    _mock_signal_for_feed(
                        {
                            "signal_type": result["signal_type"],
                            "score": result["score"],
                            "severity": result["severity"],
                            "reason_json": result["reason_json"],
                        },
                        asset.id,
                        latest.captured_at,
                    )
                )

        anomaly_score = compute_composite_from_components(components)

        points.append(
            ReplayPointOut(
                timestamp=latest.captured_at,
                price=latest.price,
                volume_24h=latest.volume_24h,
                volume_1m=latest.volume_1m,
                volume_source=latest.volume_source,
                market_cap=latest.market_cap,
                anomaly_score=anomaly_score,
                signals=triggered,
                narrative=classify_narrative_from_types(signal_types),
            )
        )

    return points
