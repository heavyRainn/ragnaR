from decimal import Decimal
from types import SimpleNamespace

from app.core.config import settings
from app.signals.volume_metrics import compute_volume_metrics, snapshot_shock_volume


def _snap(
    *,
    volume_24h: str = "0",
    volume_1m: str | None = None,
    volume_source: str | None = None,
    market_cap: str | None = "1000000",
):
    return SimpleNamespace(
        volume_24h=Decimal(volume_24h),
        volume_1m=Decimal(volume_1m) if volume_1m is not None else None,
        volume_source=volume_source,
        market_cap=Decimal(market_cap) if market_cap is not None else None,
    )


def test_live_uses_volume_1m_not_cmc_24h(monkeypatch):
    monkeypatch.setattr(settings, "CMC_API_KEY", "test-key")

    latest = _snap(volume_24h="30000000000", volume_1m="12000000", volume_source="cmc_24h")
    baseline = [
        _snap(volume_24h="0", volume_1m="4000000", volume_source="bybit_1m", market_cap=None)
        for _ in range(14)
    ]

    metrics = compute_volume_metrics(latest, baseline, snapshot_count=15)

    assert metrics["current_volume_24h"] == 12_000_000.0
    assert metrics["baseline_volume_24h"] == 4_000_000.0
    assert metrics["volume_ratio"] == 3.0
    assert metrics["skip_reason"] is None


def test_live_skips_when_only_cmc_24h_available(monkeypatch):
    monkeypatch.setattr(settings, "CMC_API_KEY", "test-key")

    latest = _snap(volume_24h="30000000000", volume_1m=None, volume_source="cmc_24h")
    baseline = [
        _snap(volume_24h="29000000000", volume_1m=None, volume_source="cmc_24h")
        for _ in range(14)
    ]

    metrics = compute_volume_metrics(latest, baseline, snapshot_count=15)

    assert metrics["volume_ratio"] is None
    assert metrics["skip_reason"] == "current_volume_unavailable"
    assert snapshot_shock_volume(latest) is None


def test_rejects_implausible_mixed_legacy_ratio(monkeypatch):
    monkeypatch.setattr(settings, "CMC_API_KEY", "test-key")

    latest = _snap(volume_24h="30000000000", volume_1m="15000000", volume_source="cmc_24h")
    baseline = [
        _snap(volume_24h="5000000", volume_1m=None, volume_source="bybit_1m", market_cap=None)
        for _ in range(14)
    ]

    metrics = compute_volume_metrics(latest, baseline, snapshot_count=15)

    # Baseline falls back to legacy bybit volume_24h only when volume_1m missing.
    assert metrics["volume_ratio"] == 3.0
