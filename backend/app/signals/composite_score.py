from app.models.signal import Signal

SIGNAL_TYPE_TO_COMPONENT = {
    "volume_shock": "volume",
    "price_shock": "price",
    "quiet_accumulation": "quiet_accumulation",
}

COMPONENT_WEIGHTS = {
    "volume": 0.40,
    "price": 0.35,
    "quiet_accumulation": 0.25,
}


def compute_composite_score(active_signals: list[Signal]) -> tuple[int, dict[str, int]]:
    components = {
        "volume": 0,
        "price": 0,
        "quiet_accumulation": 0,
    }

    weighted_parts: list[tuple[str, float, int]] = []

    for signal in active_signals:
        component = SIGNAL_TYPE_TO_COMPONENT.get(signal.signal_type)
        if not component:
            continue
        components[component] = signal.score
        weighted_parts.append((component, COMPONENT_WEIGHTS[component], signal.score))

    if not weighted_parts:
        return 0, components

    total_weight = sum(weight for _, weight, _ in weighted_parts)
    composite = sum((weight / total_weight) * score for _, weight, score in weighted_parts)

    return min(100, int(round(composite))), components


def compute_composite_from_components(components: dict[str, int]) -> int:
    weighted_parts = [
        (component, COMPONENT_WEIGHTS[component], score)
        for component, score in components.items()
        if score > 0 and component in COMPONENT_WEIGHTS
    ]
    if not weighted_parts:
        return 0
    total_weight = sum(weight for _, weight, _ in weighted_parts)
    composite = sum((weight / total_weight) * score for _, weight, score in weighted_parts)
    return min(100, int(round(composite)))
