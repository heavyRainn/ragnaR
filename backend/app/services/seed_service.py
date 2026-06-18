from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.demo_replay_scenarios import (
    SEED_SNAPSHOT_COUNT,
    SNAPSHOT_INTERVAL_HOURS,
    apply_price_return,
    build_snapshot_specs,
)
from app.services.demo_signal_alignment import align_demo_signal_timestamps
from app.services.sector_mapping import resolve_sector
from app.services.seed_data import ANCHOR_PRICES, SEED_ASSETS
from app.services.signal_service import refresh_signals


def _base_volume(rank: int) -> Decimal:
    cap = Decimal("45000000000") / Decimal(str(rank))
    return max(cap, Decimal("50000000")).quantize(Decimal("1"))


def _market_cap(rank: int, price: Decimal) -> Decimal:
    supply_factor = Decimal(str(max(1_000_000_000 // rank, 10_000_000)))
    return (price * supply_factor).quantize(Decimal("1"))


def is_seeded(db: Session) -> bool:
    count = db.execute(select(func.count()).select_from(Asset)).scalar_one()
    return count > 0


def seed_database(db: Session) -> None:
    if settings.is_live_data:
        return
    if is_seeded(db):
        return

    now = datetime.now(timezone.utc)

    for item in SEED_ASSETS:
        symbol = item["symbol"]
        rank = item["rank"]
        asset = Asset(
            cmc_id=item["cmc_id"],
            symbol=symbol,
            name=item["name"],
            slug=item["slug"],
            rank=rank,
            category=resolve_sector(symbol),
            is_active=True,
            history_backfill_attempted=True,
            history_backfilled=True,
        )
        db.add(asset)
        db.flush()

        base_price = Decimal(ANCHOR_PRICES.get(symbol, "1.00"))
        base_volume = _base_volume(rank)
        specs = build_snapshot_specs(symbol, rank, SEED_SNAPSHOT_COUNT)

        current_price = base_price
        for index, spec in enumerate(specs):
            captured_at = now - timedelta(
                hours=SNAPSHOT_INTERVAL_HOURS * (SEED_SNAPSHOT_COUNT - 1 - index)
            )
            if index == 0:
                current_price = base_price
            else:
                current_price = apply_price_return(current_price, spec.price_return)

            volume = (base_volume * Decimal(str(spec.volume_multiplier))).quantize(Decimal("1"))
            pct_24h = Decimal(str(round(spec.percent_change_24h, 2)))
            pct_1h = Decimal(str(round(float(pct_24h) * 0.12, 2)))

            db.add(
                MarketSnapshot(
                    asset_id=asset.id,
                    price=current_price,
                    volume_24h=volume,
                    market_cap=_market_cap(rank, current_price),
                    percent_change_1h=pct_1h,
                    percent_change_24h=pct_24h,
                    percent_change_7d=Decimal(str(round(float(pct_24h) * 2.1, 2))),
                    cmc_rank=rank,
                    captured_at=captured_at,
                )
            )

    db.commit()
    refresh_signals(db)
    align_demo_signal_timestamps(db)
