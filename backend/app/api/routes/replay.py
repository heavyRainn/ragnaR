from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.asset import Asset
from app.schemas.replay import ReplayPointOut
from app.services.replay_service import build_replay_for_asset
from sqlalchemy import select

router = APIRouter(prefix="/api/replay", tags=["replay"])


@router.get("/{symbol}", response_model=list[ReplayPointOut])
def get_replay(symbol: str, db: Session = Depends(get_db)) -> list[ReplayPointOut]:
    asset = db.execute(select(Asset).where(Asset.symbol == symbol.upper())).scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return build_replay_for_asset(db, asset)
