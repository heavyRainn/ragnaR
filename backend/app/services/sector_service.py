from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.asset import AssetOut
from app.schemas.sector import SectorAssetOut, SectorDetailOut
from app.schemas.signal import SignalOut
from app.services.market_narrative_service import SECTOR_NARRATIVE_LABELS
from app.services.market_rotation_service import build_market_rotation
from app.services.narrative_service import signal_feed_description
from app.services.sector_utils import normalize_sector
from app.services.sector_mapping import resolve_sector
from app.services.signal_service import get_active_signals_for_asset, get_anomaly_score, get_top_signal_for_asset


def _latest_snapshot(db: Session, asset_id: int) -> MarketSnapshot | None:
    return db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset_id)
        .order_by(desc(MarketSnapshot.captured_at))
        .limit(1)
    ).scalar_one_or_none()


def _sector_label(sector: str) -> str:
    return SECTOR_NARRATIVE_LABELS.get(sector, sector)


def build_sector_narrative(
    sector: str,
    *,
    radar_score: float,
    active_signals_count: int,
    is_market_leader: bool,
    average_24h_change: float,
) -> str:
    label = _sector_label(sector)

    if is_market_leader and radar_score >= 50:
        return f"Capital rotating into {label}."

    if sector == "Meme" and active_signals_count >= 3:
        return "Speculative activity increasing in meme assets."

    if active_signals_count >= 4:
        return f"Elevated signal activity across {label}."

    if radar_score >= 60:
        return f"{label} showing strong anomaly concentration."

    if average_24h_change >= 3:
        return f"{label} outperforming on 24h price action with rising radar attention."

    if radar_score < 15 and active_signals_count == 0:
        return f"No significant anomalies detected in {label} right now."

    return f"Market attention in {label} remains moderate."


def build_sector_detail(db: Session, sector_param: str) -> SectorDetailOut | None:
    sector = normalize_sector(sector_param)
    if sector is None:
        return None

    assets = (
        db.execute(
            select(Asset)
            .where(Asset.is_active.is_(True))
            .order_by(Asset.rank.nulls_last(), Asset.symbol)
        )
        .scalars()
        .all()
    )

    sector_assets: list[Asset] = []
    for asset in assets:
        category = asset.category or resolve_sector(asset.symbol)
        if category == sector:
            sector_assets.append(asset)

    if not sector_assets:
        return None

    rotation = build_market_rotation(db)
    sector_row = next((s for s in rotation.sectors if s.sector == sector), None)
    avg_change = sector_row.average_24h_change if sector_row else 0.0

    scored: list[tuple[Asset, int]] = []
    active_signals: list = []

    for asset in sector_assets:
        score = get_anomaly_score(db, asset.id)
        scored.append((asset, score))
        active_signals.extend(get_active_signals_for_asset(db, asset.id))

    scored.sort(key=lambda row: row[1], reverse=True)
    scores = [s for _, s in scored]
    radar_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    top_assets: list[SectorAssetOut] = []
    for asset, score in scored[:10]:
        top = get_top_signal_for_asset(db, asset.id)
        top_assets.append(
            SectorAssetOut(
                asset=AssetOut.model_validate(asset),
                anomaly_score=score,
                main_signal=top.signal_type if top else None,
            )
        )

    signal_outs: list[SignalOut] = []
    for signal in sorted(active_signals, key=lambda s: (s.score, s.created_at), reverse=True):
        out = SignalOut.model_validate(signal)
        asset = next((a for a in sector_assets if a.id == signal.asset_id), None)
        out.asset_symbol = asset.symbol if asset else None
        out.asset_name = asset.name if asset else None
        out.feed_description = signal_feed_description(signal)
        signal_outs.append(out)

    is_leader = rotation.leader_sector == sector

    return SectorDetailOut(
        sector=sector,
        radar_score=radar_score,
        average_score=radar_score,
        active_signals_count=len(active_signals),
        assets_count=len(sector_assets),
        average_24h_change=avg_change,
        narrative=build_sector_narrative(
            sector,
            radar_score=radar_score,
            active_signals_count=len(active_signals),
            is_market_leader=is_leader,
            average_24h_change=avg_change,
        ),
        top_assets=top_assets,
        active_signals=signal_outs,
        is_market_leader=is_leader,
    )
