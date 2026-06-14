from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.market_snapshot import MarketSnapshot
from app.schemas.asset import MarketSnapshotOut
from app.services.asset_access import get_trackable_asset
from app.services.snapshot_history_service import history_snapshot_limit

router = APIRouter(prefix="/api/assets", tags=["snapshots"])


@router.get("/{symbol}/snapshots", response_model=list[MarketSnapshotOut])
def get_asset_snapshots(symbol: str, db: Session = Depends(get_db)) -> list[MarketSnapshot]:
    asset = get_trackable_asset(db, symbol)
    limit = history_snapshot_limit()

    rows = (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
            .order_by(desc(MarketSnapshot.captured_at))
            .limit(limit)
        )
        .scalars()
        .all()
    )

    return list(reversed(rows))
