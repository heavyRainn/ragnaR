from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.models.market_snapshot import MarketSnapshot
from app.services.signal_service import refresh_signals

SEED_ASSETS = [
    {"symbol": "BTC", "name": "Bitcoin", "slug": "bitcoin", "rank": 1, "cmc_id": 1},
    {"symbol": "ETH", "name": "Ethereum", "slug": "ethereum", "rank": 2, "cmc_id": 1027},
    {"symbol": "SOL", "name": "Solana", "slug": "solana", "rank": 5, "cmc_id": 5426},
    {"symbol": "XRP", "name": "XRP", "slug": "xrp", "rank": 6, "cmc_id": 52},
    {"symbol": "DOGE", "name": "Dogecoin", "slug": "dogecoin", "rank": 8, "cmc_id": 74},
    {"symbol": "LINK", "name": "Chainlink", "slug": "chainlink", "rank": 14, "cmc_id": 1975},
    {"symbol": "AVAX", "name": "Avalanche", "slug": "avalanche", "rank": 12, "cmc_id": 5805},
    {"symbol": "TON", "name": "Toncoin", "slug": "toncoin", "rank": 10, "cmc_id": 11419},
    {"symbol": "ADA", "name": "Cardano", "slug": "cardano", "rank": 11, "cmc_id": 2010},
    {"symbol": "NEAR", "name": "NEAR Protocol", "slug": "near-protocol", "rank": 20, "cmc_id": 6535},
]

VOLUME_PROFILES: dict[str, float] = {
    "BTC": 1.2,
    "ETH": 1.5,
    "SOL": 4.5,
    "XRP": 3.8,
    "DOGE": 5.2,
    "LINK": 2.1,
    "AVAX": 3.2,
    "TON": 1.8,
    "ADA": 4.0,
    "NEAR": 2.5,
}

BASE_PRICES: dict[str, Decimal] = {
    "BTC": Decimal("104250.00"),
    "ETH": Decimal("3785.50"),
    "SOL": Decimal("178.40"),
    "XRP": Decimal("0.5820"),
    "DOGE": Decimal("0.1425"),
    "LINK": Decimal("15.80"),
    "AVAX": Decimal("38.25"),
    "TON": Decimal("6.45"),
    "ADA": Decimal("0.4850"),
    "NEAR": Decimal("5.10"),
}

BASE_VOLUMES: dict[str, Decimal] = {
    "BTC": Decimal("28000000000"),
    "ETH": Decimal("15000000000"),
    "SOL": Decimal("2800000000"),
    "XRP": Decimal("1900000000"),
    "DOGE": Decimal("1200000000"),
    "LINK": Decimal("650000000"),
    "AVAX": Decimal("580000000"),
    "TON": Decimal("420000000"),
    "ADA": Decimal("510000000"),
    "NEAR": Decimal("280000000"),
}

MARKET_CAPS: dict[str, Decimal] = {
    "BTC": Decimal("2050000000000"),
    "ETH": Decimal("455000000000"),
    "SOL": Decimal("84000000000"),
    "XRP": Decimal("32000000000"),
    "DOGE": Decimal("21000000000"),
    "LINK": Decimal("9500000000"),
    "AVAX": Decimal("15500000000"),
    "TON": Decimal("16200000000"),
    "ADA": Decimal("17000000000"),
    "NEAR": Decimal("5600000000"),
}

PERCENT_CHANGE_24H: dict[str, Decimal] = {
    "BTC": Decimal("1.25"),
    "ETH": Decimal("-0.85"),
    "SOL": Decimal("6.40"),
    "XRP": Decimal("-2.10"),
    "DOGE": Decimal("3.75"),
    "LINK": Decimal("2.30"),
    "AVAX": Decimal("4.20"),
    "TON": Decimal("-1.45"),
    "ADA": Decimal("0.95"),
    "NEAR": Decimal("5.10"),
}

# Stable baseline returns for Price Shock detection (5 historical snapshots)
PRICE_SHOCK_BASELINE_24H: dict[str, list[Decimal]] = {
    "SOL": [
        Decimal("1.2"),
        Decimal("1.0"),
        Decimal("1.1"),
        Decimal("0.9"),
        Decimal("1.3"),
    ],
    "NEAR": [
        Decimal("0.8"),
        Decimal("1.0"),
        Decimal("0.7"),
        Decimal("0.9"),
        Decimal("1.1"),
    ],
}

# Latest 24h return spikes for Price Shock demo assets
PRICE_SHOCK_LATEST_24H: dict[str, Decimal] = {
    "SOL": Decimal("8.40"),
    "NEAR": Decimal("7.50"),
}

# High volume + flat price for Quiet Accumulation demo assets
QUIET_ACCUMULATION_PROFILES: dict[str, dict[str, Decimal | float]] = {
    "LINK": {"volume_multiplier": 4.0, "latest_pct": Decimal("0.80")},
    "TON": {"volume_multiplier": 3.5, "latest_pct": Decimal("1.10")},
}


def is_seeded(db: Session) -> bool:
    count = db.execute(select(func.count()).select_from(Asset)).scalar_one()
    return count > 0


def _resolve_percent_change_24h(symbol: str, index: int, is_latest: bool) -> Decimal:
    if is_latest and symbol in QUIET_ACCUMULATION_PROFILES:
        return Decimal(str(QUIET_ACCUMULATION_PROFILES[symbol]["latest_pct"]))

    if is_latest and symbol in PRICE_SHOCK_LATEST_24H:
        return PRICE_SHOCK_LATEST_24H[symbol]

    if symbol in PRICE_SHOCK_BASELINE_24H and index < len(PRICE_SHOCK_BASELINE_24H[symbol]):
        return PRICE_SHOCK_BASELINE_24H[symbol][index]

    latest_pct = PERCENT_CHANGE_24H[symbol]
    if is_latest:
        return latest_pct
    return latest_pct - Decimal(str(0.4 * (5 - index)))


def _resolve_volume_multiplier(symbol: str, is_latest: bool, default_multiplier: float) -> float:
    if is_latest and symbol in QUIET_ACCUMULATION_PROFILES:
        return float(QUIET_ACCUMULATION_PROFILES[symbol]["volume_multiplier"])
    return default_multiplier if is_latest else 1.0


def seed_database(db: Session) -> None:
    if is_seeded(db):
        return

    now = datetime.now(timezone.utc)

    for item in SEED_ASSETS:
        symbol = item["symbol"]
        asset = Asset(
            cmc_id=item["cmc_id"],
            symbol=symbol,
            name=item["name"],
            slug=item["slug"],
            rank=item["rank"],
            category="cryptocurrency",
            is_active=True,
        )
        db.add(asset)
        db.flush()

        base_price = BASE_PRICES[symbol]
        base_volume = BASE_VOLUMES[symbol]
        multiplier = VOLUME_PROFILES[symbol]
        latest_pct = PERCENT_CHANGE_24H[symbol]

        for i in range(6):
            captured_at = now - timedelta(hours=4 * (5 - i))
            is_latest = i == 5
            price_jitter = Decimal("1") + Decimal(str(0.005 * (i - 2)))
            volume = base_volume * Decimal(
                str(_resolve_volume_multiplier(symbol, is_latest, multiplier))
            )
            pct_24h = _resolve_percent_change_24h(symbol, i, is_latest)

            snapshot = MarketSnapshot(
                asset_id=asset.id,
                price=(base_price * price_jitter).quantize(Decimal("0.00000001")),
                volume_24h=volume,
                market_cap=MARKET_CAPS[symbol],
                percent_change_1h=Decimal(str(round(float(latest_pct) * 0.15 * (i - 2), 2))),
                percent_change_24h=pct_24h,
                percent_change_7d=Decimal(str(round(float(latest_pct) * 2.5, 2))),
                cmc_rank=item["rank"],
                captured_at=captured_at,
            )
            db.add(snapshot)

    db.commit()
    refresh_signals(db)
