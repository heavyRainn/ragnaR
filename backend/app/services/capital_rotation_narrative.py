from typing import Literal

from app.schemas.market_rotation import SectorRotationOut

SectorTrend = Literal["strengthening", "weakening", "neutral"]

TREND_STRENGTHEN_THRESHOLD = 0.35
TREND_WEAKEN_THRESHOLD = -0.35


def compute_sector_trend(change_24h: float, change_1h: float) -> SectorTrend:
    composite = change_1h * 0.35 + change_24h * 0.65
    if composite >= TREND_STRENGTHEN_THRESHOLD or (change_1h > 0.15 and change_24h > 0):
        return "strengthening"
    if composite <= TREND_WEAKEN_THRESHOLD or (change_1h < -0.15 and change_24h < 0):
        return "weakening"
    return "neutral"


def build_capital_rotation_narrative(
    sectors: list[SectorRotationOut],
    *,
    strongest_sector: str | None,
    weakest_sector: str | None,
    best_1h_sector: str | None,
    worst_1h_sector: str | None,
) -> str:
    pool = [s for s in sectors if s.sector != "Other" and s.assets_count > 0]
    if not pool:
        return "Sector performance remains broadly balanced."

    strongest = next((s for s in pool if s.sector == strongest_sector), None)
    weakest = next((s for s in pool if s.sector == weakest_sector), None)
    best_1h = next((s for s in pool if s.sector == best_1h_sector), None)
    worst_1h = next((s for s in pool if s.sector == worst_1h_sector), None)

    if (
        strongest
        and weakest
        and strongest.sector != weakest.sector
        and strongest.average_24h_change - weakest.average_24h_change >= 0.35
    ):
        return f"Capital rotating into {strongest.sector} while {weakest.sector} weakens."

    if (
        best_1h
        and worst_1h
        and best_1h.sector != worst_1h.sector
        and best_1h.average_1h_change >= 0.25
        and worst_1h.average_1h_change <= -0.25
    ):
        return (
            f"{best_1h.sector} shows the strongest 1h momentum "
            f"while {worst_1h.sector} leads 1h declines."
        )

    if strongest and strongest.average_24h_change >= 0.25:
        return f"{strongest.sector} leads sector performance on 24h price action."

    if weakest and weakest.average_24h_change <= -0.25:
        return f"{weakest.sector} is underperforming on 24h price action."

    if best_1h and best_1h.average_1h_change >= 0.3:
        return f"{best_1h.sector} shows the strongest 1h improvement across sectors."

    if worst_1h and worst_1h.average_1h_change <= -0.3:
        return f"{worst_1h.sector} shows the steepest 1h decline across sectors."

    return "Sector performance remains broadly balanced."
