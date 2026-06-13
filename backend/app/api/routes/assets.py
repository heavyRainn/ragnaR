from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.asset import AssetDetailOut, AssetOut, MarketSnapshotOut
from app.schemas.score import ScoreBreakdownOut
from app.schemas.signal import SignalOut
from app.services.narrative_service import classify_narrative
from app.services.signal_service import (
    get_active_signals_for_asset,
    get_anomaly_score,
    get_score_breakdown,
    get_signal_timeline,
)
from app.signals.common import MIN_SNAPSHOTS
from app.signals.helpers import count_snapshots

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=list[AssetOut])
def list_assets(db: Session = Depends(get_db)) -> list[Asset]:
    return db.execute(select(Asset).order_by(Asset.rank.nulls_last(), Asset.symbol)).scalars().all()


@router.get("/{symbol}", response_model=AssetDetailOut)
def get_asset(symbol: str, db: Session = Depends(get_db)) -> AssetDetailOut:
    asset = db.execute(select(Asset).where(Asset.symbol == symbol.upper())).scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    latest_snapshot = db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset.id)
        .order_by(desc(MarketSnapshot.captured_at))
        .limit(1)
    ).scalar_one_or_none()

    recent_signals = get_active_signals_for_asset(db, asset.id)
    signal_timeline = get_signal_timeline(db, asset.id)
    total_score, components = get_score_breakdown(db, asset.id)

    return AssetDetailOut(
        asset=AssetOut.model_validate(asset),
        latest_snapshot=MarketSnapshotOut.model_validate(latest_snapshot) if latest_snapshot else None,
        recent_signals=[SignalOut.model_validate(s) for s in recent_signals],
        signal_timeline=[SignalOut.model_validate(s) for s in signal_timeline],
        anomaly_score=get_anomaly_score(db, asset.id),
        score_breakdown=ScoreBreakdownOut(total_score=total_score, components=components),
        narrative=classify_narrative(recent_signals),
        snapshot_count=count_snapshots(db, asset.id),
        required_snapshot_count=MIN_SNAPSHOTS,
    )
