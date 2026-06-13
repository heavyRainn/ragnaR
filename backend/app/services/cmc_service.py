from decimal import Decimal
from typing import Any

import httpx

CMC_QUOTES_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"


class CoinMarketCapError(Exception):
    pass


def fetch_quotes_by_ids(api_key: str, cmc_ids: list[int]) -> dict[str, Any]:
    if not cmc_ids:
        return {}

    response = httpx.get(
        CMC_QUOTES_URL,
        params={"id": ",".join(str(i) for i in cmc_ids)},
        headers={
            "X-CMC_PRO_API_KEY": api_key,
            "Accept": "application/json",
        },
        timeout=30.0,
    )

    if response.status_code != 200:
        raise CoinMarketCapError(
            f"CMC API error {response.status_code}: {response.text[:200]}"
        )

    payload = response.json()
    return payload.get("data", {})


def parse_quote(cmc_id: int, data: dict[str, Any]) -> dict[str, Any] | None:
    entry = data.get(str(cmc_id))
    if not entry:
        return None

    usd = entry.get("quote", {}).get("USD", {})
    if not usd:
        return None

    def to_decimal(value: Any) -> Decimal | None:
        if value is None:
            return None
        return Decimal(str(value))

    return {
        "price": to_decimal(usd.get("price")),
        "volume_24h": to_decimal(usd.get("volume_24h")),
        "market_cap": to_decimal(usd.get("market_cap")),
        "percent_change_1h": to_decimal(usd.get("percent_change_1h")),
        "percent_change_24h": to_decimal(usd.get("percent_change_24h")),
        "percent_change_7d": to_decimal(usd.get("percent_change_7d")),
        "cmc_rank": entry.get("cmc_rank"),
    }
