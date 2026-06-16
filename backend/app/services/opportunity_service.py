from sqlalchemy import case, desc, select
from sqlalchemy.orm import Session, joinedload

from app.models.signal import Signal
from app.schemas.opportunity import OpportunityFeedItemOut
from app.services.sector_mapping import resolve_sector


def build_opportunity_feed(db: Session, *, limit: int = 20) -> list[OpportunityFeedItemOut]:
    signals = (
        db.execute(
            select(Signal)
            .options(joinedload(Signal.asset))
            .order_by(
                case((Signal.status == "active", 0), else_=1),
                desc(Signal.score),
                desc(Signal.created_at),
            )
            .limit(limit * 2)
        )
        .scalars()
        .all()
    )

    def sort_key(signal: Signal) -> tuple:
        active_rank = 0 if signal.status == "active" else 1
        return (active_rank, -signal.score, -signal.created_at.timestamp())

    sorted_signals = sorted(signals, key=sort_key)[:limit]

    items: list[OpportunityFeedItemOut] = []
    for signal in sorted_signals:
        asset = signal.asset
        sector = None
        if asset:
            sector = asset.category or resolve_sector(asset.symbol)
        items.append(
            OpportunityFeedItemOut(
                id=signal.id,
                asset_symbol=asset.symbol if asset else "?",
                asset_name=asset.name if asset else "?",
                sector=sector,
                signal_type=signal.signal_type,
                score=signal.score,
                severity=signal.severity,
                status=signal.status,
                detected_at=signal.created_at,
            )
        )
    return items
