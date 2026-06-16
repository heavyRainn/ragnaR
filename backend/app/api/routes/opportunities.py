from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.opportunity import OpportunityFeedItemOut
from app.services.opportunity_service import build_opportunity_feed

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


@router.get("", response_model=list[OpportunityFeedItemOut])
def list_opportunities(
    limit: int = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[OpportunityFeedItemOut]:
    return build_opportunity_feed(db, limit=limit)
