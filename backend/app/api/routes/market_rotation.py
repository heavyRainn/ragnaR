from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.market_rotation import MarketRotationOut
from app.services.market_rotation_service import build_market_rotation

router = APIRouter(prefix="/api/market-rotation", tags=["market-rotation"])


@router.get("", response_model=MarketRotationOut)
def get_market_rotation(db: Session = Depends(get_db)) -> MarketRotationOut:
    return build_market_rotation(db)
