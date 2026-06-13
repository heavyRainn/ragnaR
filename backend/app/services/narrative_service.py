from app.models.signal import Signal
from app.schemas.narrative import NARRATIVE_COPY, NarrativeOut


def _active_types(signals: list[Signal]) -> set[str]:
    return {s.signal_type for s in signals if s.status == "active"}


def classify_narrative(signals: list[Signal]) -> NarrativeOut:
    active = [s for s in signals if s.status == "active"]
    if not active:
        copy = NARRATIVE_COPY["NORMAL"]
        return NarrativeOut(type="NORMAL", title=copy["title"], description=copy["description"])

    types = _active_types(active)
    has_volume = "volume_shock" in types
    has_price = "price_shock" in types
    has_quiet = "quiet_accumulation" in types

    if has_volume and has_quiet:
        narrative_type = "ACCUMULATION"
    elif has_volume and has_price:
        narrative_type = "MOMENTUM_EXPANSION"
    elif has_price and not has_volume and not has_quiet:
        narrative_type = "VOLATILITY_EVENT"
    else:
        narrative_type = "MIXED_SIGNAL"

    copy = NARRATIVE_COPY[narrative_type]
    return NarrativeOut(type=narrative_type, title=copy["title"], description=copy["description"])


def classify_narrative_from_types(signal_types: set[str]) -> NarrativeOut:
    if not signal_types:
        copy = NARRATIVE_COPY["NORMAL"]
        return NarrativeOut(type="NORMAL", title=copy["title"], description=copy["description"])

    has_volume = "volume_shock" in signal_types
    has_price = "price_shock" in signal_types
    has_quiet = "quiet_accumulation" in signal_types

    if has_volume and has_quiet:
        narrative_type = "ACCUMULATION"
    elif has_volume and has_price:
        narrative_type = "MOMENTUM_EXPANSION"
    elif has_price and not has_volume and not has_quiet:
        narrative_type = "VOLATILITY_EVENT"
    else:
        narrative_type = "MIXED_SIGNAL"

    copy = NARRATIVE_COPY[narrative_type]
    return NarrativeOut(type=narrative_type, title=copy["title"], description=copy["description"])


def signal_feed_description(signal: Signal) -> str:
    reason = signal.reason_json or {}
    if signal.signal_type == "volume_shock":
        ratio = reason.get("volume_ratio")
        if ratio is not None:
            return f"Volume {float(ratio):.1f}x above baseline"
        return "Volume significantly above baseline"
    if signal.signal_type == "price_shock":
        return "24h return statistically unusual"
    if signal.signal_type == "quiet_accumulation":
        return "Volume rising without price movement"
    return "Anomaly pattern detected"


def compute_market_mode(active_signal_count: int, critical_count: int) -> str:
    if critical_count >= 3 or active_signal_count >= 9:
        return "HIGH ATTENTION"
    if active_signal_count >= 3:
        return "ACTIVE"
    return "NORMAL"
