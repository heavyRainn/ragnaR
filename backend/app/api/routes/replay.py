from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.replay import ReplayOut
from app.services.asset_access import get_trackable_asset
from app.services.recent_events_service import get_default_replay_symbol, resolve_replay_symbol
from app.services.replay_service import build_replay_for_asset
from app.services.signal_outcome_service import compute_replay_quick_indices, get_reference_signal_for_asset
from app.signals.common import MIN_SNAPSHOTS
from app.signals.helpers import count_snapshots

router = APIRouter(prefix="/api/replay", tags=["replay"])


@router.get("/default-symbol")
def get_replay_default_symbol(db: Session = Depends(get_db)) -> dict[str, str]:
    return {"symbol": get_default_replay_symbol(db)}


@router.get("/{symbol}", response_model=ReplayOut)
def get_replay(symbol: str, db: Session = Depends(get_db)) -> ReplayOut:
    resolved = resolve_replay_symbol(db, symbol)
    asset = get_trackable_asset(db, resolved)

    points = build_replay_for_asset(db, asset)
    reference_signal = get_reference_signal_for_asset(db, asset.id)

    return ReplayOut(
        symbol=asset.symbol,
        points=points,
        snapshot_count=count_snapshots(db, asset.id),
        required_snapshot_count=MIN_SNAPSHOTS,
        quick_indices=compute_replay_quick_indices(points, reference_signal),
    )
