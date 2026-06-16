from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.sector import SectorDetailOut
from app.services.sector_service import build_sector_detail

router = APIRouter(prefix="/api/sectors", tags=["sectors"])


@router.get("/{sector}", response_model=SectorDetailOut)
def get_sector_detail(sector: str, db: Session = Depends(get_db)) -> SectorDetailOut:
    detail = build_sector_detail(db, sector)
    if detail is None:
        raise HTTPException(status_code=404, detail="Sector not found or has no assets")
    return detail
