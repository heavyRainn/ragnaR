from collections import defaultdict
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.schemas.sector_replay import SectorReplayOut, SectorReplayPointOut
from app.services.market_rotation_service import build_market_rotation
from app.services.replay_service import build_replay_for_asset
from app.services.sector_mapping import resolve_sector
from app.services.sector_utils import normalize_sector


def _sector_assets(db: Session, sector: str) -> list[Asset]:
    assets = (
        db.execute(select(Asset).where(Asset.is_active.is_(True)))
        .scalars()
        .all()
    )
    return [
        asset
        for asset in assets
        if (asset.category or resolve_sector(asset.symbol)) == sector
    ]


def build_sector_replay(db: Session, sector_param: str) -> SectorReplayOut | None:
    sector = normalize_sector(sector_param)
    if sector is None:
        return None

    assets = _sector_assets(db, sector)
    if not assets:
        return None

    scores_by_ts: dict[datetime, list[float]] = defaultdict(list)
    signals_by_ts: dict[datetime, int] = defaultdict(int)
    assets_by_ts: dict[datetime, int] = defaultdict(int)

    for asset in assets:
        replay = build_replay_for_asset(db, asset)
        for point in replay:
            ts = point.timestamp
            scores_by_ts[ts].append(float(point.anomaly_score))
            signals_by_ts[ts] += len(point.signals)
            assets_by_ts[ts] += 1

    if not scores_by_ts:
        return SectorReplayOut(
            sector=sector,
            points=[],
            narrative=f"No replay history available for {sector} sector yet.",
        )

    points: list[SectorReplayPointOut] = []
    for ts in sorted(scores_by_ts.keys()):
        scores = scores_by_ts[ts]
        points.append(
            SectorReplayPointOut(
                timestamp=ts,
                sector_score=round(sum(scores) / len(scores), 1),
                active_signals_count=signals_by_ts[ts],
                assets_in_sector=assets_by_ts[ts],
            )
        )

    score_start = points[0].sector_score
    score_end = points[-1].sector_score
    score_change = round(score_end - score_start, 1)

    rotation = build_market_rotation(db)
    leader_end = rotation.leader_sector
    leader_start = rotation.lagging_sector if rotation.lagging_sector != leader_end else None

    if score_change >= 15:
        narrative = f"{sector} sector score surged from {score_start} to {score_end}."
    elif score_change <= -15:
        narrative = f"{sector} sector score cooled from {score_start} to {score_end}."
    elif leader_end == sector and leader_start and leader_start != sector:
        narrative = f"{sector} emerged as the leading sector (replacing {leader_start})."
    elif points[-1].active_signals_count > 0:
        narrative = f"Active signals detected in {sector} — latest sector score {score_end}."
    else:
        narrative = f"{sector} sector score tracking at {score_end}."

    return SectorReplayOut(
        sector=sector,
        points=points,
        score_start=score_start,
        score_end=score_end,
        score_change=score_change,
        leader_sector_start=leader_start,
        leader_sector_end=leader_end,
        narrative=narrative,
    )
