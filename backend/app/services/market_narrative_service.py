from app.schemas.market_rotation import SectorRotationOut

MARKET_QUIET_SCORE_THRESHOLD = 20.0
LEADER_SCORE_THRESHOLD = 50.0
MEME_ACTIVITY_THRESHOLD = 3
LEADER_DOMINANCE_GAP = 8.0

SECTOR_NARRATIVE_LABELS: dict[str, str] = {
    "AI": "AI infrastructure assets",
    "DeFi": "DeFi protocols",
    "Layer1": "Layer 1 networks",
    "Meme": "meme assets",
    "Gaming": "gaming tokens",
    "Infrastructure": "infrastructure assets",
    "RWA": "real-world asset tokens",
    "Other": "uncategorized assets",
}


def _sector_label(sector: str | None) -> str:
    if not sector:
        return "the market"
    return SECTOR_NARRATIVE_LABELS.get(sector, sector.lower())


def _leader_sector_data(
    sectors: list[SectorRotationOut], leader_sector: str | None
) -> SectorRotationOut | None:
    if not leader_sector:
        return None
    return next((s for s in sectors if s.sector == leader_sector), None)


def _is_clear_leader(sectors: list[SectorRotationOut], leader_sector: str | None) -> bool:
    ranked = [s for s in sectors if s.sector != "Other"]
    if len(ranked) < 2 or not leader_sector:
        return False
    leader = ranked[0]
    runner_up = ranked[1]
    return leader.average_radar_score - runner_up.average_radar_score >= LEADER_DOMINANCE_GAP


def build_market_narrative(
    *,
    leader_sector: str | None,
    lagging_sector: str | None,
    most_active_sector: str | None,
    sectors: list[SectorRotationOut],
    market_average_score: float,
) -> str:
    if market_average_score < MARKET_QUIET_SCORE_THRESHOLD:
        return "No significant market-wide anomalies detected."

    leader_data = _leader_sector_data(sectors, leader_sector)
    clear_leader = _is_clear_leader(sectors, leader_sector)

    if leader_sector == "Meme" and leader_data and leader_data.active_signals_count > MEME_ACTIVITY_THRESHOLD:
        return "Speculative activity increasing in meme assets."

    if leader_sector == "AI" and leader_data and leader_data.average_radar_score > LEADER_SCORE_THRESHOLD:
        return "Capital rotating into AI infrastructure assets."

    if leader_sector and leader_data and leader_data.average_radar_score > LEADER_SCORE_THRESHOLD:
        return f"Capital rotating into {_sector_label(leader_sector)}."

    if most_active_sector and most_active_sector != leader_sector:
        active_data = _leader_sector_data(sectors, most_active_sector)
        if active_data and active_data.active_signals_count >= 2:
            return (
                f"Elevated signal activity in {_sector_label(most_active_sector)} "
                f"while {_sector_label(lagging_sector)} lags."
            )

    if not clear_leader:
        return "Market attention remains broadly distributed."

    if leader_sector and lagging_sector and leader_sector != lagging_sector:
        return (
            f"Radar attention concentrated in {_sector_label(leader_sector)}; "
            f"{lagging_sector} sector shows weaker anomaly scores."
        )

    return "Market attention remains broadly distributed."
