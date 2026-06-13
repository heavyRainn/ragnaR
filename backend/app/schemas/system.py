from typing import Literal

from pydantic import BaseModel


class SystemStatusOut(BaseModel):
    data_source: Literal["live", "mock"]
    cmc_api_configured: bool
    message: str
