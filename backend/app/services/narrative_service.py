from app.models.signal import Signal
from app.schemas.narrative import NARRATIVE_COPY, NarrativeOut


def _active_types(signals: list[Signal]) -> set[str]:
    return {s.signal_type for s in signals if s.status == "active"}


def _resolve_narrative_type(types: set[str]) -> str:
    if not types:
        return "NORMAL"

    has_volume = "volume_shock" in types
    has_price = "price_shock" in types
    has_quiet = "quiet_accumulation" in types

    if has_quiet:
        return "ACCUMULATION"
    if has_volume and has_price:
        return "MOMENTUM_EXPANSION"
    if has_price:
        return "VOLATILITY_EVENT"
    if has_volume:
        return "VOLUME_ANOMALY"
    return "NORMAL"


def classify_narrative(signals: list[Signal]) -> NarrativeOut:
    active = [s for s in signals if s.status == "active"]
    narrative_type = _resolve_narrative_type(_active_types(active))
    copy = NARRATIVE_COPY[narrative_type]
    return NarrativeOut(type=narrative_type, title=copy["title"], description=copy["description"])


def classify_narrative_from_types(signal_types: set[str]) -> NarrativeOut:
    narrative_type = _resolve_narrative_type(signal_types)
    copy = NARRATIVE_COPY[narrative_type]
    return NarrativeOut(type=narrative_type, title=copy["title"], description=copy["description"])


def signal_feed_description(signal: Signal) -> str:
    if signal.status != "active":
        return "Signal resolved"

    reason = signal.reason_json or {}
    if signal.signal_type == "volume_shock":
        ratio = reason.get("volume_ratio")
        if ratio is not None:
            return f"Volume {float(ratio):.1f}x above baseline"
        return "Volume significantly above baseline"
    if signal.signal_type == "price_shock":
        z = reason.get("price_z_score")
        if z is not None:
            return f"Price return z-score {float(z):.1f} exceeds threshold"
        return "Price return statistically unusual"
    if signal.signal_type == "quiet_accumulation":
        return "Volume rising without price movement"
    return "Anomaly pattern detected"


def compute_market_mode(active_signal_count: int, critical_count: int) -> str:
    if critical_count >= 3 or active_signal_count >= 9:
        return "HIGH ATTENTION"
    if active_signal_count >= 3:
        return "ACTIVE"
    return "NORMAL"
