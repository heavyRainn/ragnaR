from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.market_story import MarketStoryOut
from app.services.market_story_service import build_market_story

router = APIRouter(prefix="/api/market-story", tags=["market-story"])


@router.get("", response_model=MarketStoryOut)
def get_market_story(db: Session = Depends(get_db)) -> MarketStoryOut:
    return build_market_story(db)
