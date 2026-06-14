from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.asset import AssetOut
from app.schemas.radar import RadarItemOut
from app.services.narrative_service import classify_narrative
from app.services.signal_outcome_service import get_move_after_signal_percent
from app.services.signal_service import (
    extract_volume_ratio,
    get_active_signals_for_asset,
    get_anomaly_score,
    get_composite_severity,
    get_top_signal_for_asset,
)

router = APIRouter(prefix="/api/radar", tags=["radar"])


@router.get("", response_model=list[RadarItemOut])
def get_radar(db: Session = Depends(get_db)) -> list[RadarItemOut]:
    assets = (
        db.execute(
            select(Asset)
            .where(Asset.is_active.is_(True))
            .order_by(Asset.rank.nulls_last())
        )
        .scalars()
        .all()
    )

    items: list[RadarItemOut] = []

    for asset in assets:
        active_signals = get_active_signals_for_asset(db, asset.id)
        top_signal = get_top_signal_for_asset(db, asset.id)
        latest_snapshot = db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
            .order_by(desc(MarketSnapshot.captured_at))
            .limit(1)
        ).scalar_one_or_none()

        items.append(
            RadarItemOut(
                asset=AssetOut.model_validate(asset),
                price=latest_snapshot.price if latest_snapshot else None,
                volume_24h=latest_snapshot.volume_24h if latest_snapshot else None,
                market_cap=latest_snapshot.market_cap if latest_snapshot else None,
                percent_change_1h=latest_snapshot.percent_change_1h if latest_snapshot else None,
                percent_change_24h=latest_snapshot.percent_change_24h if latest_snapshot else None,
                anomaly_score=get_anomaly_score(db, asset.id),
                severity=get_composite_severity(db, asset.id),
                main_signal=top_signal.signal_type if top_signal else None,
                volume_ratio=extract_volume_ratio(active_signals),
                narrative=classify_narrative(active_signals),
                move_after_signal_percent=get_move_after_signal_percent(db, asset.id),
            )
        )

    items.sort(key=lambda x: x.anomaly_score, reverse=True)
    return items
