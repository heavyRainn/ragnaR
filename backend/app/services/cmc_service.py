from decimal import Decimal
from typing import Any

import httpx

CMC_QUOTES_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"
CMC_LISTINGS_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"


class CoinMarketCapError(Exception):
    pass


def _cmc_headers(api_key: str) -> dict[str, str]:
    return {
        "X-CMC_PRO_API_KEY": api_key,
        "Accept": "application/json",
    }


def fetch_quotes_by_ids(api_key: str, cmc_ids: list[int]) -> dict[str, Any]:
    if not cmc_ids:
        return {}

    response = httpx.get(
        CMC_QUOTES_URL,
        params={"id": ",".join(str(i) for i in cmc_ids)},
        headers=_cmc_headers(api_key),
        timeout=30.0,
    )

    if response.status_code != 200:
        raise CoinMarketCapError(
            f"CMC API error {response.status_code}: {response.text[:200]}"
        )

    payload = response.json()
    return payload.get("data", {})


def fetch_listings_latest(
    api_key: str,
    *,
    start: int = 1,
    limit: int = 100,
    convert: str = "USD",
) -> list[dict[str, Any]]:
    response = httpx.get(
        CMC_LISTINGS_URL,
        params={"start": start, "limit": limit, "convert": convert},
        headers=_cmc_headers(api_key),
        timeout=30.0,
    )

    if response.status_code != 200:
        raise CoinMarketCapError(
            f"CMC listings error {response.status_code}: {response.text[:200]}"
        )

    payload = response.json()
    return payload.get("data", [])


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


def parse_listing(entry: dict[str, Any]) -> dict[str, Any] | None:
    usd = entry.get("quote", {}).get("USD", {})
    if not usd:
        return None

    def to_decimal(value: Any) -> Decimal | None:
        if value is None:
            return None
        return Decimal(str(value))

    price = to_decimal(usd.get("price"))
    volume = to_decimal(usd.get("volume_24h"))
    if price is None or volume is None:
        return None

    return {
        "cmc_id": entry.get("id"),
        "symbol": entry.get("symbol"),
        "name": entry.get("name"),
        "slug": entry.get("slug"),
        "rank": entry.get("cmc_rank"),
        "price": price,
        "volume_24h": volume,
        "market_cap": to_decimal(usd.get("market_cap")),
        "percent_change_1h": to_decimal(usd.get("percent_change_1h")),
        "percent_change_24h": to_decimal(usd.get("percent_change_24h")),
        "percent_change_7d": to_decimal(usd.get("percent_change_7d")),
        "cmc_rank": entry.get("cmc_rank"),
    }
