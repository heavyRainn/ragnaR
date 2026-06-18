"""Deterministic mock replay storylines for hackathon demos.

Generates snapshot series that pass the existing signal evaluators without
changing engine thresholds. Only used in mock mode during initial seed.
"""

from collections.abc import Callable
from dataclasses import dataclass
from decimal import Decimal

# Assets with curated replay timelines — excluded from mock refresh cloning.
DEMO_REPLAY_SYMBOLS: frozenset[str] = frozenset({"KAS", "SOL", "LINK", "PEPE", "BONK"})

SEED_SNAPSHOT_COUNT = 30
SNAPSHOT_INTERVAL_HOURS = 3

# Small alternating returns — keeps baseline std above MIN_STD_RETURN (0.001).
_BASELINE_RETURNS: tuple[float, ...] = (
    0.0018,
    -0.0014,
    0.0022,
    -0.0019,
    0.0016,
    -0.0012,
    0.0020,
    -0.0017,
    0.0015,
    -0.0013,
)


@dataclass(frozen=True)
class SnapshotSpec:
    price_return: float
    volume_multiplier: float
    percent_change_24h: float


def _baseline_return(index: int) -> float:
    return _BASELINE_RETURNS[index % len(_BASELINE_RETURNS)]


def _momentum_expansion(index: int) -> SnapshotSpec:
    """Volume shock first, then price shock — Momentum Expansion narrative."""
    if index < 21:
        return SnapshotSpec(
            price_return=_baseline_return(index),
            volume_multiplier=1.0,
            percent_change_24h=0.4 + (index % 4) * 0.12,
        )
    if index == 21:
        return SnapshotSpec(
            price_return=_baseline_return(index),
            volume_multiplier=4.8,
            percent_change_24h=1.2,
        )
    if index < 28:
        return SnapshotSpec(
            price_return=_baseline_return(index),
            volume_multiplier=1.0,
            percent_change_24h=1.0 + (index % 3) * 0.15,
        )
    if index == 28:
        return SnapshotSpec(
            price_return=0.028,
            volume_multiplier=1.0,
            percent_change_24h=3.5,
        )
    return SnapshotSpec(
        price_return=0.078,
        volume_multiplier=6.2,
        percent_change_24h=8.6,
    )


def _quiet_accumulation(index: int) -> SnapshotSpec:
    """High volume with flat price, then a delayed move."""
    if index < 28:
        return SnapshotSpec(
            price_return=_baseline_return(index),
            volume_multiplier=1.0,
            percent_change_24h=0.55 + (index % 3) * 0.12,
        )
    if index == 28:
        return SnapshotSpec(
            price_return=_baseline_return(index),
            volume_multiplier=4.4,
            percent_change_24h=0.85,
        )
    return SnapshotSpec(
        price_return=0.058,
        volume_multiplier=5.6,
        percent_change_24h=1.15,
    )


def _volatility_event(index: int) -> SnapshotSpec:
    """Sharp price shock with visible post-signal follow-through."""
    if index < 26:
        return SnapshotSpec(
            price_return=_baseline_return(index),
            volume_multiplier=1.0,
            percent_change_24h=-0.6 + (index % 5) * 0.25,
        )
    if index == 26:
        return SnapshotSpec(
            price_return=0.085,
            volume_multiplier=1.1,
            percent_change_24h=9.8,
        )
    if index < 29:
        return SnapshotSpec(
            price_return=_baseline_return(index),
            volume_multiplier=1.0,
            percent_change_24h=11.5 + (index - 26) * 1.8,
        )
    return SnapshotSpec(
        price_return=0.105,
        volume_multiplier=1.0,
        percent_change_24h=17.4,
    )


def _default_spec(index: int, symbol: str, rank: int) -> SnapshotSpec:
    h = sum(ord(c) for c in symbol)
    pct = ((h % 23) - 11) * 0.28 + (rank % 7 - 3) * 0.15 + (index % 4 - 2) * 0.05
    vol = 1.0 + (index % 5) * 0.02
    if index == SEED_SNAPSHOT_COUNT - 1 and symbol in _LEGACY_VOLUME_SPIKES:
        vol = _LEGACY_VOLUME_SPIKES[symbol]
    return SnapshotSpec(
        price_return=_baseline_return(index) if index > 0 else 0.0,
        volume_multiplier=vol,
        percent_change_24h=pct,
    )


_LEGACY_VOLUME_SPIKES: dict[str, float] = {
    "DOGE": 5.2,
    "SHIB": 4.6,
    "WIF": 5.8,
    "FLOKI": 4.2,
    "TRX": 3.5,
    "AVAX": 3.2,
}

_SCENARIO_BUILDERS: dict[str, Callable[[int], SnapshotSpec]] = {
    "KAS": _momentum_expansion,
    "SOL": _momentum_expansion,
    "LINK": _quiet_accumulation,
    "PEPE": _volatility_event,
    "BONK": _volatility_event,
}


def build_snapshot_specs(symbol: str, rank: int, count: int = SEED_SNAPSHOT_COUNT) -> list[SnapshotSpec]:
    builder = _SCENARIO_BUILDERS.get(symbol)
    specs: list[SnapshotSpec] = []
    for index in range(count):
        if builder is not None:
            spec = builder(index)
        else:
            spec = _default_spec(index, symbol, rank)
        specs.append(spec)
    return specs


def apply_price_return(prev_price: Decimal, price_return: float) -> Decimal:
    factor = Decimal(str(1 + price_return))
    return (prev_price * factor).quantize(Decimal("0.00000001"))
