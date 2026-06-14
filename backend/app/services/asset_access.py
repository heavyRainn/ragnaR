from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset


def get_trackable_asset(db: Session, symbol: str) -> Asset:
    asset = db.execute(select(Asset).where(Asset.symbol == symbol.upper())).scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if settings.is_live_data and not asset.is_active:
        raise HTTPException(status_code=404, detail="Asset not in live tracking set")
    return asset
