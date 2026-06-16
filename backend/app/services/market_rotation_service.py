from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.market_rotation import MarketRotationOut, SectorRotationOut
from app.services.capital_rotation_narrative import (
    build_capital_rotation_narrative,
    compute_sector_trend,
)
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
            "changes_24h": [],
            "changes_1h": [],
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
                "changes_24h": [],
                "changes_1h": [],
                "active_signals": 0,
                "assets_count": 0,
            })

        bucket = sector_buckets[sector]
        bucket["assets_count"] += 1
        bucket["scores"].append(get_anomaly_score(db, asset.id))

        snapshot = _latest_snapshot(db, asset.id)
        if snapshot and snapshot.percent_change_24h is not None:
            bucket["changes_24h"].append(float(snapshot.percent_change_24h))
        if snapshot and snapshot.percent_change_1h is not None:
            bucket["changes_1h"].append(float(snapshot.percent_change_1h))

        active = get_active_signals_for_asset(db, asset.id)
        bucket["active_signals"] += len(active)

    sectors: list[SectorRotationOut] = []
    for sector, bucket in sector_buckets.items():
        if bucket["assets_count"] == 0:
            continue
        avg_score = round(sum(bucket["scores"]) / len(bucket["scores"]), 1)
        avg_change_24h = (
            round(sum(bucket["changes_24h"]) / len(bucket["changes_24h"]), 2)
            if bucket["changes_24h"]
            else 0.0
        )
        avg_change_1h = (
            round(sum(bucket["changes_1h"]) / len(bucket["changes_1h"]), 2)
            if bucket["changes_1h"]
            else 0.0
        )
        sectors.append(
            SectorRotationOut(
                sector=sector,
                average_radar_score=avg_score,
                average_24h_change=avg_change_24h,
                average_1h_change=avg_change_1h,
                active_signals_count=bucket["active_signals"],
                assets_count=bucket["assets_count"],
                trend=compute_sector_trend(avg_change_24h, avg_change_1h),
            )
        )

    sectors.sort(key=lambda s: s.average_24h_change, reverse=True)

    pool = [s for s in sectors if s.sector in TRACKED_SECTORS]
    if not pool:
        pool = [s for s in sectors if s.sector != "Other"]
    if not pool:
        pool = sectors

    strongest_sector = max(pool, key=lambda s: s.average_24h_change).sector if pool else None
    weakest_sector = min(pool, key=lambda s: s.average_24h_change).sector if pool else None
    best_1h_sector = max(pool, key=lambda s: s.average_1h_change).sector if pool else None
    worst_1h_sector = min(pool, key=lambda s: s.average_1h_change).sector if pool else None
    most_active_sector = (
        max(pool, key=lambda s: s.active_signals_count).sector if pool else None
    )

    leader_sector = strongest_sector
    lagging_sector = weakest_sector

    market_narrative = build_capital_rotation_narrative(
        sectors,
        strongest_sector=strongest_sector,
        weakest_sector=weakest_sector,
        best_1h_sector=best_1h_sector,
        worst_1h_sector=worst_1h_sector,
    )

    return MarketRotationOut(
        leader_sector=leader_sector,
        lagging_sector=lagging_sector,
        most_active_sector=most_active_sector,
        strongest_sector=strongest_sector,
        weakest_sector=weakest_sector,
        best_1h_sector=best_1h_sector,
        worst_1h_sector=worst_1h_sector,
        market_narrative=market_narrative,
        sectors=sectors,
    )
