from typing import Any

from pydantic import BaseModel


class MarketStoryItemOut(BaseModel):
    key: str
    params: dict[str, Any]


class MarketStoryOut(BaseModel):
    headline_key: str
    stories: list[MarketStoryItemOut]
