import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.cmc_service import CoinMarketCapError, fetch_quotes_by_ids, parse_quote
from app.services.signal_service import refresh_signals

logger = logging.getLogger(__name__)

_last_sync: datetime | None = None


def sync_from_coinmarketcap(db: Session, *, force: bool = False) -> bool:
    """Fetch live quotes from CoinMarketCap and persist as new snapshots."""
    global _last_sync

    api_key = settings.CMC_API_KEY
    if not api_key:
        return False

    now = datetime.now(timezone.utc)
    interval = settings.CMC_REFRESH_INTERVAL_SECONDS

    if not force and _last_sync and (now - _last_sync).total_seconds() < interval:
        return False

    assets = db.execute(select(Asset).where(Asset.is_active.is_(True))).scalars().all()
    cmc_ids = [a.cmc_id for a in assets if a.cmc_id is not None]
    if not cmc_ids:
        return False

    try:
        raw = fetch_quotes_by_ids(api_key, cmc_ids)
    except CoinMarketCapError as exc:
        logger.warning("CoinMarketCap sync failed: %s", exc)
        return False
    except httpx.HTTPError as exc:
        logger.warning("CoinMarketCap HTTP error: %s", exc)
        return False

    synced = 0
    for asset in assets:
        if asset.cmc_id is None:
            continue

        parsed = parse_quote(asset.cmc_id, raw)
        if not parsed or parsed["price"] is None or parsed["volume_24h"] is None:
            continue

        if parsed["cmc_rank"] is not None:
            asset.rank = parsed["cmc_rank"]

        snapshot = MarketSnapshot(
            asset_id=asset.id,
            price=parsed["price"],
            volume_24h=parsed["volume_24h"],
            market_cap=parsed["market_cap"],
            percent_change_1h=parsed["percent_change_1h"],
            percent_change_24h=parsed["percent_change_24h"],
            percent_change_7d=parsed["percent_change_7d"],
            cmc_rank=parsed["cmc_rank"],
            captured_at=now,
        )
        db.add(snapshot)
        synced += 1

    if synced == 0:
        return False

    db.commit()
    refresh_signals(db)
    _last_sync = now
    logger.info("Synced %s assets from CoinMarketCap", synced)
    return True
