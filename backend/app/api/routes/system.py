from fastapi import APIRouter

from app.core.config import settings
from app.schemas.system import SystemStatusOut

router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/status", response_model=SystemStatusOut)
def get_system_status() -> SystemStatusOut:
    cmc_configured = bool(settings.CMC_API_KEY and settings.CMC_API_KEY.strip())

    if cmc_configured:
        return SystemStatusOut(
            data_source="live",
            cmc_api_configured=True,
            message="Using CoinMarketCap live data",
        )

    return SystemStatusOut(
        data_source="mock",
        cmc_api_configured=False,
        message="Using seeded mock data",
    )
