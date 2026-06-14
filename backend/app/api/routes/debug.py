from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.debug import AssetFreshnessOut, SignalDebugOut, VolumeShockDebugOut
from app.services.debug_service import build_signal_debug, build_volume_shock_debug
from app.services.freshness_service import build_freshness_report

router = APIRouter(prefix="/api/debug", tags=["debug"])


@router.get("/freshness", response_model=list[AssetFreshnessOut])
def debug_freshness(db: Session = Depends(get_db)) -> list[AssetFreshnessOut]:
    return build_freshness_report(db)


@router.get("/signals", response_model=list[SignalDebugOut])
def debug_signals(db: Session = Depends(get_db)) -> list[SignalDebugOut]:
    return build_signal_debug(db)


@router.get("/volume-shock/{symbol}", response_model=VolumeShockDebugOut)
def debug_volume_shock(symbol: str, db: Session = Depends(get_db)) -> VolumeShockDebugOut:
    return build_volume_shock_debug(db, symbol)
