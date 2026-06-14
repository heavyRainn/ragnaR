from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.signal import Signal
from app.schemas.recent_events import RecentMarketEventOut
from app.schemas.signal import SignalOut
from app.services.narrative_service import signal_feed_description
from app.services.recent_events_service import build_recent_market_events

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("/recent", response_model=list[RecentMarketEventOut])
def list_recent_market_events(
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[RecentMarketEventOut]:
    return build_recent_market_events(db, limit=limit)


@router.get("", response_model=list[SignalOut])
def list_signals(db: Session = Depends(get_db)) -> list[SignalOut]:
    signals = (
        db.execute(
            select(Signal)
            .options(joinedload(Signal.asset))
            .where(Signal.status == "active")
            .order_by(desc(Signal.score), desc(Signal.created_at))
            .limit(50)
        )
        .scalars()
        .all()
    )

    result: list[SignalOut] = []
    for signal in signals:
        out = SignalOut.model_validate(signal)
        out.asset_symbol = signal.asset.symbol if signal.asset else None
        out.asset_name = signal.asset.name if signal.asset else None
        out.feed_description = signal_feed_description(signal)
        result.append(out)
    return result
