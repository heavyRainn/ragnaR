from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.debug import SignalDebugOut
from app.services.debug_service import build_signal_debug

router = APIRouter(prefix="/api/debug", tags=["debug"])


@router.get("/signals", response_model=list[SignalDebugOut])
def debug_signals(db: Session = Depends(get_db)) -> list[SignalDebugOut]:
    return build_signal_debug(db)
