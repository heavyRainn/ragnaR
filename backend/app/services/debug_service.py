from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.schemas.debug import SignalDebugOut, VolumeShockDebugOut, VolumeShockSnapshotDebugOut
from app.services.signal_service import get_anomaly_score, get_active_signals_for_asset
from app.signals.evaluator import evaluate_asset_candidates
from app.signals.helpers import count_snapshots, get_baseline_snapshots, get_chronological_snapshots, get_latest_snapshot
from app.signals.volume_metrics import classify_snapshot_volume_source, compute_volume_metrics, snapshot_shock_volume


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


def build_volume_shock_debug(db: Session, symbol: str) -> VolumeShockDebugOut:
    asset = db.execute(
        select(Asset).where(Asset.symbol == symbol.upper())
    ).scalar_one_or_none()

    if not asset:
        return VolumeShockDebugOut(
            symbol=symbol.upper(),
            current_volume=None,
            baseline_volume=None,
            ratio=None,
            snapshot_count=0,
            skip_reason="asset_not_found",
            volume_unit=None,
            snapshots=[],
        )

    snapshot_count = count_snapshots(db, asset.id)
    latest = get_latest_snapshot(db, asset.id)
    baseline = get_baseline_snapshots(db, asset.id)
    chronological = get_chronological_snapshots(db, asset.id, limit=20)

    metrics = (
        compute_volume_metrics(latest, baseline, snapshot_count)
        if latest
        else {
            "volume_ratio": None,
            "baseline_volume_24h": None,
            "current_volume_24h": None,
            "volume_unit": None,
            "skip_reason": "no_latest_snapshot",
        }
    )

    snapshots_out: list[VolumeShockSnapshotDebugOut] = []
    for snap in chronological:
        shock_vol = snapshot_shock_volume(snap)
        snapshots_out.append(
            VolumeShockSnapshotDebugOut(
                captured_at=snap.captured_at,
                price=float(snap.price),
                volume_24h=float(snap.volume_24h),
                volume_1m=float(snap.volume_1m) if snap.volume_1m is not None else None,
                volume_source=classify_snapshot_volume_source(snap),
                shock_volume=float(shock_vol) if shock_vol is not None else None,
                market_cap=float(snap.market_cap) if snap.market_cap is not None else None,
            )
        )

    return VolumeShockDebugOut(
        symbol=asset.symbol,
        current_volume=metrics.get("current_volume_24h"),
        baseline_volume=metrics.get("baseline_volume_24h"),
        ratio=metrics.get("volume_ratio"),
        snapshot_count=snapshot_count,
        skip_reason=metrics.get("skip_reason"),
        volume_unit=metrics.get("volume_unit"),
        snapshots=snapshots_out,
    )
