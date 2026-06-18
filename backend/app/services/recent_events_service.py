from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.asset import Asset
from app.models.signal import Signal
from app.schemas.recent_events import RecentMarketEventOut
from app.services.signal_outcome_service import compute_move_for_signal


def _trackable_assets_filter(query):
    if settings.is_live_data:
        return query.where(Asset.is_active.is_(True))
    return query


def _is_trackable(db: Session, symbol: str) -> bool:
    asset = db.execute(select(Asset).where(Asset.symbol == symbol.upper())).scalar_one_or_none()
    if not asset:
        return False
    if settings.is_live_data and not asset.is_active:
        return False
    return True


def build_recent_market_events(db: Session, limit: int = 10) -> list[RecentMarketEventOut]:
    query = (
        select(Signal)
        .join(Asset)
        .options(joinedload(Signal.asset))
        .order_by(desc(Signal.created_at))
        .limit(limit)
    )
    signals = db.execute(_trackable_assets_filter(query)).scalars().all()

    events: list[RecentMarketEventOut] = []
    for signal in signals:
        if not signal.asset:
            continue
        events.append(
            RecentMarketEventOut(
                asset_symbol=signal.asset.symbol,
                asset_name=signal.asset.name,
                signal_type=signal.signal_type,
                peak_score=signal.score,
                status=signal.status,
                detected_at=signal.created_at,
                move_after_signal_percent=compute_move_for_signal(db, signal),
            )
        )
    return events


def get_default_replay_symbol(db: Session) -> str:
    """Pick a trackable asset with signal history, else SOL, else BTC."""
    active_query = (
        select(Signal)
        .join(Asset)
        .options(joinedload(Signal.asset))
        .where(Signal.status == "active")
        .order_by(desc(Signal.score), desc(Signal.created_at))
    )
    active = db.execute(_trackable_assets_filter(active_query).limit(1)).scalar_one_or_none()
    if active and active.asset:
        return active.asset.symbol

    resolved_query = (
        select(Signal)
        .join(Asset)
        .options(joinedload(Signal.asset))
        .where(Signal.status == "resolved")
        .order_by(desc(Signal.updated_at), desc(Signal.created_at))
    )
    resolved = db.execute(_trackable_assets_filter(resolved_query).limit(1)).scalar_one_or_none()
    if resolved and resolved.asset:
        return resolved.asset.symbol

    for fallback in ("KAS", "SOL", "LINK", "PEPE", "BTC"):
        asset = db.execute(
            select(Asset).where(Asset.symbol == fallback, Asset.is_active.is_(True))
        ).scalar_one_or_none()
        if asset:
            return fallback

    any_active = db.execute(
        select(Asset).where(Asset.is_active.is_(True)).order_by(Asset.rank.nulls_last()).limit(1)
    ).scalar_one_or_none()
    if any_active:
        return any_active.symbol

    return "BTC"


def resolve_replay_symbol(db: Session, requested: str | None) -> str:
    """Return a trackable symbol, falling back when requested asset is unavailable."""
    if requested and _is_trackable(db, requested):
        return requested.upper()
    return get_default_replay_symbol(db)
