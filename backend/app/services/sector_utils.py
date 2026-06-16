from app.services.sector_mapping import SECTORS


def normalize_sector(sector: str) -> str | None:
    raw = sector.strip()
    if raw in SECTORS:
        return raw
    lowered = raw.lower()
    for name in SECTORS:
        if name.lower() == lowered:
            return name
    if lowered == "layer1" or lowered == "layer-1":
        return "Layer1"
    return None


def sector_slug(sector: str) -> str:
    return sector
