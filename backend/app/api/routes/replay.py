from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.signal import Signal
from app.schemas.replay import ReplayOut
from app.schemas.sector_replay import SectorReplayOut
from app.services.asset_access import get_trackable_asset
from app.services.recent_events_service import get_default_replay_symbol, resolve_replay_symbol
from app.services.replay_service import build_replay_for_asset
from app.services.sector_replay_service import build_sector_replay
from app.services.signal_outcome_service import compute_replay_quick_indices, get_reference_signal_for_asset
from app.signals.common import MIN_SNAPSHOTS
from app.signals.helpers import count_snapshots

router = APIRouter(prefix="/api/replay", tags=["replay"])


@router.get("/default-symbol")
def get_replay_default_symbol(db: Session = Depends(get_db)) -> dict[str, str]:
    return {"symbol": get_default_replay_symbol(db)}


@router.get("/sector/{sector}", response_model=SectorReplayOut)
def get_sector_replay(sector: str, db: Session = Depends(get_db)) -> SectorReplayOut:
    replay = build_sector_replay(db, sector)
    if replay is None:
        raise HTTPException(status_code=404, detail="Sector not found")
    return replay


@router.get("/{symbol}", response_model=ReplayOut)
def get_replay(
    symbol: str,
    signal_id: int | None = Query(None, description="Focus replay on a specific persisted signal"),
    db: Session = Depends(get_db),
) -> ReplayOut:
    resolved = resolve_replay_symbol(db, symbol)
    asset = get_trackable_asset(db, resolved)

    points = build_replay_for_asset(db, asset)

    reference_signal: Signal | None = None
    if signal_id is not None:
        reference_signal = db.execute(
            select(Signal).where(Signal.id == signal_id, Signal.asset_id == asset.id)
        ).scalar_one_or_none()
        if reference_signal is None:
            raise HTTPException(status_code=404, detail="Signal not found for this asset")

    if reference_signal is None:
        reference_signal = get_reference_signal_for_asset(db, asset.id)

    return ReplayOut(
        symbol=asset.symbol,
        points=points,
        snapshot_count=count_snapshots(db, asset.id),
        required_snapshot_count=MIN_SNAPSHOTS,
        quick_indices=compute_replay_quick_indices(points, reference_signal),
    )
