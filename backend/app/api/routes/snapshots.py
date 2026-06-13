from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.asset import MarketSnapshotOut

router = APIRouter(prefix="/api/assets", tags=["snapshots"])


@router.get("/{symbol}/snapshots", response_model=list[MarketSnapshotOut])
def get_asset_snapshots(symbol: str, db: Session = Depends(get_db)) -> list[MarketSnapshot]:
    asset = db.execute(select(Asset).where(Asset.symbol == symbol.upper())).scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    return (
        db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
            .order_by(desc(MarketSnapshot.captured_at))
            .limit(50)
        )
        .scalars()
        .all()
    )
