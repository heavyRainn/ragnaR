from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.schemas.debug import SignalDebugOut
from app.services.signal_service import get_anomaly_score, get_active_signals_for_asset
from app.signals.evaluator import evaluate_asset_candidates


def build_signal_debug(db: Session) -> list[SignalDebugOut]:
    assets = db.execute(select(Asset).where(Asset.is_active.is_(True)).order_by(Asset.rank)).scalars().all()
    results: list[SignalDebugOut] = []

    for asset in assets:
        evaluation = evaluate_asset_candidates(db, asset)
        latest = evaluation["latest"]
        volume_metrics = evaluation["volume_metrics"]
        price_metrics = evaluation["price_metrics"]
        active = get_active_signals_for_asset(db, asset.id)

        skip_reasons = [
            evaluation[t]["skip_reason"]
            for t in ("volume_shock", "price_shock", "quiet_accumulation")
            if evaluation[t].get("skip_reason") and not evaluation[t].get("triggered")
        ]
        primary_skip = skip_reasons[0] if skip_reasons else volume_metrics.get("skip_reason")

        results.append(
            SignalDebugOut(
                symbol=asset.symbol,
                snapshot_count=evaluation["snapshot_count"],
                latest_price=float(latest.price) if latest else None,
                latest_volume=float(latest.volume_24h) if latest else None,
                volume_ratio=volume_metrics.get("volume_ratio"),
                price_return=price_metrics.get("current_return"),
                price_z_score=price_metrics.get("price_z_score"),
                volume_triggered=evaluation["volume_shock"].get("triggered", False),
                price_triggered=evaluation["price_shock"].get("triggered", False),
                quiet_accumulation_triggered=evaluation["quiet_accumulation"].get("triggered", False),
                composite_score=get_anomaly_score(db, asset.id),
                active_signals=[s.signal_type for s in active],
                skip_reason=primary_skip,
            )
        )

    return results
