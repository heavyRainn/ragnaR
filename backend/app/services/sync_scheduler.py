import asyncio
import logging

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.refresh_service import refresh_market_data

logger = logging.getLogger(__name__)

_sync_task: asyncio.Task | None = None


async def _background_sync_loop() -> None:
    interval = settings.cmc_sync_interval
    logger.info("Market sync scheduler started (interval=%ss)", interval)

    while True:
        await asyncio.sleep(interval)
        db = SessionLocal()
        try:
            refresh_market_data(db)
        except Exception:
            logger.exception("Background market sync failed")
        finally:
            db.close()


async def start_background_sync() -> None:
    global _sync_task
    if _sync_task is not None:
        return
    _sync_task = asyncio.create_task(_background_sync_loop())


async def stop_background_sync() -> None:
    global _sync_task
    if _sync_task is None:
        return
    _sync_task.cancel()
    try:
        await _sync_task
    except asyncio.CancelledError:
        pass
    _sync_task = None
    logger.info("Market sync scheduler stopped")
