from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.asset import Asset
from app.schemas.replay import ReplayOut
from app.services.replay_service import build_replay_for_asset
from app.signals.common import MIN_SNAPSHOTS
from app.signals.helpers import count_snapshots

router = APIRouter(prefix="/api/replay", tags=["replay"])


@router.get("/{symbol}", response_model=ReplayOut)
def get_replay(symbol: str, db: Session = Depends(get_db)) -> ReplayOut:
    asset = db.execute(select(Asset).where(Asset.symbol == symbol.upper())).scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return ReplayOut(
        points=build_replay_for_asset(db, asset),
        snapshot_count=count_snapshots(db, asset.id),
        required_snapshot_count=MIN_SNAPSHOTS,
    )
