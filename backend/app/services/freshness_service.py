from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.schemas.debug import AssetFreshnessOut


def build_freshness_report(db: Session) -> list[AssetFreshnessOut]:
    now = datetime.now(timezone.utc)

    assets = (
        db.execute(
            select(Asset).where(Asset.is_active.is_(True)).order_by(Asset.rank.nulls_last(), Asset.symbol)
        )
        .scalars()
        .all()
    )

    report: list[AssetFreshnessOut] = []

    for asset in assets:
        latest = db.execute(
            select(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
            .order_by(desc(MarketSnapshot.captured_at))
            .limit(1)
        ).scalar_one_or_none()

        snapshot_count = db.execute(
            select(func.count())
            .select_from(MarketSnapshot)
            .where(MarketSnapshot.asset_id == asset.id)
        ).scalar_one()

        latest_at = latest.captured_at if latest else None
        age_seconds = int((now - latest_at).total_seconds()) if latest_at else None

        report.append(
            AssetFreshnessOut(
                symbol=asset.symbol,
                latest_snapshot_at=latest_at,
                snapshot_age_seconds=age_seconds,
                snapshot_count=snapshot_count,
                latest_price=latest.price if latest else None,
                latest_volume_24h=latest.volume_24h if latest else None,
                history_backfilled=asset.history_backfilled,
                history_backfill_attempted=asset.history_backfill_attempted,
                is_active=asset.is_active,
            )
        )

    return report
