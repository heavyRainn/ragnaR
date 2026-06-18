"""Validate demo replay scenarios produce meaningful signal timelines."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace

from app.services.demo_replay_scenarios import (
    SEED_SNAPSHOT_COUNT,
    apply_price_return,
    build_snapshot_specs,
)
from app.signals.composite_score import compute_composite_from_components
from app.signals.helpers import compute_price_metrics, compute_volume_metrics
from app.signals.price_shock import evaluate_price_shock_candidate
from app.signals.quiet_accumulation import evaluate_quiet_accumulation_candidate
from app.signals.volume_shock import evaluate_volume_shock_candidate


def _snap(price: Decimal, volume: Decimal, pct_24h: float, captured_at: datetime):
    return SimpleNamespace(
        price=price,
        volume_24h=volume,
        volume_1m=None,
        volume_source=None,
        market_cap=Decimal("1000000000"),
        percent_change_24h=Decimal(str(pct_24h)),
        captured_at=captured_at,
    )


def _build_series(symbol: str, rank: int = 10):
    base_price = Decimal("100")
    base_volume = Decimal("100000000")
    specs = build_snapshot_specs(symbol, rank, SEED_SNAPSHOT_COUNT)
    now = datetime.now(timezone.utc)
    snapshots = []
    price = base_price
    for index, spec in enumerate(specs):
        if index > 0:
            price = apply_price_return(price, spec.price_return)
        volume = base_volume * Decimal(str(spec.volume_multiplier))
        snapshots.append(
            _snap(
                price,
                volume,
                spec.percent_change_24h,
                now - timedelta(hours=3 * (SEED_SNAPSHOT_COUNT - 1 - index)),
            )
        )
    return snapshots


def _replay_scores(snapshots: list) -> list[int]:
    scores: list[int] = []
    for index in range(len(snapshots)):
        latest = snapshots[index]
        chronological = snapshots[: index + 1]
        baseline = chronological[:-1]
        baseline_window = baseline[-20:] if len(baseline) > 20 else baseline
        volume_metrics = compute_volume_metrics(latest, baseline_window, len(chronological))
        price_metrics = compute_price_metrics(chronological, len(chronological))

        components: dict[str, int] = {}
        for result, key in (
            (
                evaluate_volume_shock_candidate(
                    latest, baseline_window, len(chronological), volume_metrics
                ),
                "volume",
            ),
            (evaluate_price_shock_candidate(latest, len(chronological), price_metrics), "price"),
            (
                evaluate_quiet_accumulation_candidate(
                    latest, len(chronological), volume_metrics, price_metrics
                ),
                "quiet_accumulation",
            ),
        ):
            if result.get("triggered"):
                components[key] = result["score"]

        scores.append(compute_composite_from_components(components))
    return scores


def _first_detection(scores: list[int]) -> int | None:
    for index, score in enumerate(scores):
        if index < 14:
            continue
        if score >= 40:
            return index
    return None


def test_kas_momentum_replay_arc():
    scores = _replay_scores(_build_series("KAS"))
    assert scores[14] == 0
    detection = _first_detection(scores)
    assert detection is not None
    assert detection < SEED_SNAPSHOT_COUNT - 3
    assert scores[-1] >= 70


def test_link_quiet_accumulation_replay_arc():
    scores = _replay_scores(_build_series("LINK"))
    assert scores[14] == 0
    detection = _first_detection(scores)
    assert detection is not None
    assert scores[-1] >= 60


def test_pepe_volatility_replay_arc():
    scores = _replay_scores(_build_series("PEPE"))
    assert scores[14] == 0
    detection = _first_detection(scores)
    assert detection is not None
    assert scores[-1] >= 60


def test_demo_snapshot_count():
    assert len(build_snapshot_specs("SOL", 6)) == SEED_SNAPSHOT_COUNT
