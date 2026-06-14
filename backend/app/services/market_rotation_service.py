from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.market_rotation import MarketRotationOut, SectorRotationOut
from app.services.market_narrative_service import build_market_narrative
from app.services.sector_mapping import SECTORS, resolve_sector
from app.services.signal_service import get_active_signals_for_asset, get_anomaly_score

TRACKED_SECTORS = tuple(s for s in SECTORS if s != "Other")


def _latest_snapshot(db: Session, asset_id: int) -> MarketSnapshot | None:
    return db.execute(
        select(MarketSnapshot)
        .where(MarketSnapshot.asset_id == asset_id)
        .order_by(desc(MarketSnapshot.captured_at))
        .limit(1)
    ).scalar_one_or_none()


def build_market_rotation(db: Session) -> MarketRotationOut:
    assets = (
        db.execute(select(Asset).where(Asset.is_active.is_(True)).order_by(Asset.rank.nulls_last()))
        .scalars()
        .all()
    )

    sector_buckets: dict[str, dict] = {
        sector: {
            "scores": [],
            "changes": [],
            "active_signals": 0,
            "assets_count": 0,
        }
        for sector in SECTORS
    }

    for asset in assets:
        sector = asset.category or resolve_sector(asset.symbol)
        if sector not in sector_buckets:
            sector = "Other"
            sector_buckets.setdefault("Other", {
                "scores": [],
                "changes": [],
                "active_signals": 0,
                "assets_count": 0,
            })

        bucket = sector_buckets[sector]
        bucket["assets_count"] += 1
        bucket["scores"].append(get_anomaly_score(db, asset.id))

        snapshot = _latest_snapshot(db, asset.id)
        if snapshot and snapshot.percent_change_24h is not None:
            bucket["changes"].append(float(snapshot.percent_change_24h))

        active = get_active_signals_for_asset(db, asset.id)
        bucket["active_signals"] += len(active)

    sectors: list[SectorRotationOut] = []
    for sector, bucket in sector_buckets.items():
        if bucket["assets_count"] == 0:
            continue
        avg_score = round(sum(bucket["scores"]) / len(bucket["scores"]), 1)
        avg_change = (
            round(sum(bucket["changes"]) / len(bucket["changes"]), 2)
            if bucket["changes"]
            else 0.0
        )
        sectors.append(
            SectorRotationOut(
                sector=sector,
                average_radar_score=avg_score,
                average_24h_change=avg_change,
                active_signals_count=bucket["active_signals"],
                assets_count=bucket["assets_count"],
            )
        )

    sectors.sort(key=lambda s: s.average_radar_score, reverse=True)

    ranked = [s for s in sectors if s.sector in TRACKED_SECTORS]
    pool = ranked if ranked else sectors

    leader_sector = max(pool, key=lambda s: s.average_radar_score).sector if pool else None
    lagging_sector = min(pool, key=lambda s: s.average_radar_score).sector if pool else None
    most_active_sector = (
        max(pool, key=lambda s: s.active_signals_count).sector if pool else None
    )

    market_avg_score = (
        round(sum(s.average_radar_score * s.assets_count for s in sectors) / sum(s.assets_count for s in sectors), 1)
        if sectors
        else 0.0
    )

    market_narrative = build_market_narrative(
        leader_sector=leader_sector,
        lagging_sector=lagging_sector,
        most_active_sector=most_active_sector,
        sectors=sectors,
        market_average_score=market_avg_score,
    )

    return MarketRotationOut(
        leader_sector=leader_sector,
        lagging_sector=lagging_sector,
        most_active_sector=most_active_sector,
        market_narrative=market_narrative,
        sectors=sectors,
    )
