from datetime import datetime, timedelta, timezone

from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.models.asset import Asset
from app.models.signal import Signal
from app.schemas.market_story import MarketStoryItemOut, MarketStoryOut
from app.services.market_rotation_service import build_market_rotation
from app.services.sector_mapping import resolve_sector
from app.services.sector_replay_service import build_sector_replay
from app.services.sector_utils import normalize_sector


def build_market_story(db: Session) -> MarketStoryOut:
    rotation = build_market_rotation(db)
    stories: list[MarketStoryItemOut] = []
    now = datetime.now(timezone.utc)
    hour_ago = now - timedelta(hours=1)

    if rotation.strongest_sector and rotation.weakest_sector:
        if rotation.strongest_sector != rotation.weakest_sector:
            stories.append(
                MarketStoryItemOut(
                    key="capitalRotating",
                    params={
                        "from": rotation.weakest_sector,
                        "to": rotation.strongest_sector,
                    },
                )
            )
        else:
            stories.append(
                MarketStoryItemOut(
                    key="capitalInto",
                    params={"sector": rotation.strongest_sector},
                )
            )

    signals_last_hour = (
        db.execute(
            select(Signal)
            .options(joinedload(Signal.asset))
            .where(Signal.created_at >= hour_ago)
            .order_by(desc(Signal.created_at))
        )
        .scalars()
        .all()
    )

    sector_counts: dict[str, int] = {}
    for signal in signals_last_hour:
        if not signal.asset:
            continue
        sector = signal.asset.category or resolve_sector(signal.asset.symbol)
        sector_counts[sector] = sector_counts.get(sector, 0) + 1

    if sector_counts:
        top_sector, count = max(sector_counts.items(), key=lambda item: item[1])
        if count >= 2 and normalize_sector(top_sector):
            stories.append(
                MarketStoryItemOut(
                    key="sectorSignalsHour",
                    params={"sector": top_sector, "count": count},
                )
            )

    for sector_row in rotation.sectors[:4]:
        sector = sector_row.sector
        if sector == "Other":
            continue
        replay = build_sector_replay(db, sector)
        if replay.score_start is not None and replay.score_end is not None:
            delta = replay.score_end - replay.score_start
            if abs(delta) >= 8:
                stories.append(
                    MarketStoryItemOut(
                        key="sectorScoreDelta",
                        params={
                            "sector": sector,
                            "from": round(replay.score_start, 1),
                            "to": round(replay.score_end, 1),
                        },
                    )
                )

    if rotation.most_active_sector and rotation.most_active_sector != rotation.leader_sector:
        active_row = next(
            (s for s in rotation.sectors if s.sector == rotation.most_active_sector),
            None,
        )
        if active_row and active_row.active_signals_count >= 2:
            stories.append(
                MarketStoryItemOut(
                    key="mostActiveSector",
                    params={
                        "sector": rotation.most_active_sector,
                        "count": active_row.active_signals_count,
                    },
                )
            )

    if not stories and rotation.market_narrative:
        stories.append(
            MarketStoryItemOut(
                key="marketQuiet",
                params={"narrative": rotation.market_narrative},
            )
        )

    return MarketStoryOut(headline_key="whereIsCapital", stories=stories[:5])
