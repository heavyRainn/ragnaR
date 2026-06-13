from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import assets, debug, radar, replay, signals, snapshots, system
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.market_data_service import cleanup_mixed_mock_live_history, sync_from_coinmarketcap
from app.services.refresh_service import refresh_market_data
from app.services.seed_service import seed_database
from app.services.sync_scheduler import start_background_sync, stop_background_sync


@asynccontextmanager
async def lifespan(_: FastAPI):
    db = SessionLocal()
    try:
        if settings.CMC_API_KEY:
            cleanup_mixed_mock_live_history(db)
            sync_from_coinmarketcap(db, force=True)
        elif settings.SEED_ON_STARTUP:
            seed_database(db)
            refresh_market_data(db)
    finally:
        db.close()

    await start_background_sync()
    yield
    await stop_background_sync()


app = FastAPI(
    title="Crypto Market Intelligence Radar",
    description="Explainable anomaly detection powered by market data",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(debug.router)
app.include_router(assets.router)
app.include_router(snapshots.router)
app.include_router(signals.router)
app.include_router(replay.router)
app.include_router(radar.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
