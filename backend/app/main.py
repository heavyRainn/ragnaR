from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import assets, radar, replay, signals, snapshots, system
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.market_data_service import sync_from_coinmarketcap
from app.services.seed_service import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.SEED_ON_STARTUP:
        db = SessionLocal()
        try:
            seed_database(db)
            if settings.CMC_API_KEY:
                sync_from_coinmarketcap(db, force=True)
        finally:
            db.close()
    yield


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
app.include_router(assets.router)
app.include_router(snapshots.router)
app.include_router(signals.router)
app.include_router(replay.router)
app.include_router(radar.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
