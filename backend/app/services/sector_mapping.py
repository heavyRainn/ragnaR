"""Static sector classification for top crypto assets (top-50 / top-100)."""

SECTORS = (
    "AI",
    "DeFi",
    "Layer1",
    "Meme",
    "Gaming",
    "Infrastructure",
    "RWA",
    "Other",
)

ASSET_SECTOR_MAP: dict[str, str] = {
    # AI
    "FET": "AI",
    "RNDR": "AI",
    "RENDER": "AI",
    "TAO": "AI",
    "AGIX": "AI",
    "AKT": "AI",
    "WLD": "AI",
    "OCEAN": "AI",
    "TURBO": "AI",
    "ARKM": "AI",
    # DeFi
    "AAVE": "DeFi",
    "UNI": "DeFi",
    "MKR": "DeFi",
    "LDO": "DeFi",
    "CRV": "DeFi",
    "SNX": "DeFi",
    "COMP": "DeFi",
    "SUSHI": "DeFi",
    "1INCH": "DeFi",
    "JUP": "DeFi",
    "RUNE": "DeFi",
    "INJ": "Layer1",
    "PENDLE": "DeFi",
    "DYDX": "DeFi",
    "GMX": "DeFi",
    # Layer1
    "BTC": "Layer1",
    "ETH": "Layer1",
    "SOL": "Layer1",
    "AVAX": "Layer1",
    "ADA": "Layer1",
    "ATOM": "Layer1",
    "APT": "Layer1",
    "SUI": "Layer1",
    "DOT": "Layer1",
    "NEAR": "Layer1",
    "SEI": "Layer1",
    "TON": "Layer1",
    "TRX": "Layer1",
    "XLM": "Layer1",
    "BCH": "Layer1",
    "LTC": "Layer1",
    "ETC": "Layer1",
    "ALGO": "Layer1",
    "VET": "Layer1",
    "HBAR": "Layer1",
    "STX": "Layer1",
    "ICP": "Layer1",
    "BNB": "Layer1",
    "XRP": "Layer1",
    "MATIC": "Layer1",
    "POL": "Layer1",
    "ARB": "Layer1",
    "OP": "Layer1",
    "FTM": "Layer1",
    "EGLD": "Layer1",
    "KAS": "Layer1",
    "TIA": "Layer1",
    # Meme
    "DOGE": "Meme",
    "SHIB": "Meme",
    "PEPE": "Meme",
    "FLOKI": "Meme",
    "WIF": "Meme",
    "BONK": "Meme",
    "BRETT": "Meme",
    "MOG": "Meme",
    "NEIRO": "Meme",
    "POPCAT": "Meme",
    # Gaming
    "IMX": "Gaming",
    "BEAM": "Gaming",
    "GALA": "Gaming",
    "SAND": "Gaming",
    "MANA": "Gaming",
    "AXS": "Gaming",
    "ENJ": "Gaming",
    "RON": "Gaming",
    "PRIME": "Gaming",
    # Infrastructure
    "LINK": "Infrastructure",
    "FIL": "Infrastructure",
    "AR": "Infrastructure",
    "GRT": "Infrastructure",
    "PYTH": "Infrastructure",
    "QNT": "Infrastructure",
    "THETA": "Infrastructure",
    "HNT": "Infrastructure",
    "RPL": "Infrastructure",
    "LPT": "Infrastructure",
    "API3": "Infrastructure",
    # RWA
    "ONDO": "RWA",
    "ENA": "RWA",
    "MPL": "RWA",
    "CFG": "RWA",
    "POLYX": "RWA",
    "TRU": "RWA",
}


def resolve_sector(symbol: str) -> str:
    return ASSET_SECTOR_MAP.get(symbol.upper(), "Other")


def sync_asset_categories(db) -> int:
    """Apply sector mapping to all assets in the database."""
    from sqlalchemy import select

    from app.models.asset import Asset

    assets = db.execute(select(Asset)).scalars().all()
    updated = 0
    for asset in assets:
        sector = resolve_sector(asset.symbol)
        if asset.category != sector:
            asset.category = sector
            updated += 1
    if updated:
        db.commit()
    return updated
