import asyncio
import logging

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.refresh_service import refresh_market_data
from app.services.sync_state import sync_state

logger = logging.getLogger(__name__)

_sync_task: asyncio.Task | None = None


async def _background_sync_loop() -> None:
    interval = settings.cmc_sync_interval
    logger.info("Market sync scheduler started (interval=%ss)", interval)

    while True:
        await asyncio.sleep(interval)
        db = SessionLocal()
        try:
            logger.info("Scheduler tick — running market sync")
            success = refresh_market_data(db)
            if success:
                logger.info(
                    "Scheduler tick completed: status=%s snapshots=%s",
                    sync_state.last_sync_status,
                    sync_state.last_snapshots_inserted,
                )
            elif sync_state.last_sync_status == "skipped":
                logger.debug("Scheduler tick skipped: %s", sync_state.last_sync_error)
            else:
                logger.warning(
                    "Scheduler tick failed: %s",
                    sync_state.last_sync_error or "unknown error",
                )
        except Exception as exc:
            sync_state.mark_failed(str(exc))
            logger.exception("Background market sync failed")
        finally:
            db.close()


async def start_background_sync() -> None:
    global _sync_task
    if _sync_task is not None:
        return
    sync_state.scheduler_running = True
    _sync_task = asyncio.create_task(_background_sync_loop())
    logger.info("Background sync task created")


async def stop_background_sync() -> None:
    global _sync_task
    sync_state.scheduler_running = False
    if _sync_task is None:
        return
    _sync_task.cancel()
    try:
        await _sync_task
    except asyncio.CancelledError:
        pass
    _sync_task = None
    logger.info("Market sync scheduler stopped")
