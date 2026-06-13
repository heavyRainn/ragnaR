from app.models.signal import Signal

SIGNAL_TYPE_TO_COMPONENT = {
    "volume_shock": "volume",
    "price_shock": "price",
    "quiet_accumulation": "quiet_accumulation",
}

COMPONENT_WEIGHTS = {
    "volume": 0.35,
    "price": 0.30,
    "quiet_accumulation": 0.35,
}


def compute_composite_score(active_signals: list[Signal]) -> tuple[int, dict[str, int]]:
    weighted_parts: list[tuple[str, float, int]] = []

    for signal in active_signals:
        if signal.status != "active":
            continue
        component = SIGNAL_TYPE_TO_COMPONENT.get(signal.signal_type)
        if not component:
            continue
        weighted_parts.append((component, COMPONENT_WEIGHTS[component], signal.score))

    if not weighted_parts:
        return 0, {}

    if len(weighted_parts) == 1:
        score = weighted_parts[0][2]
        return score, {weighted_parts[0][0]: score}

    total_weight = sum(weight for _, weight, _ in weighted_parts)
    composite = sum((weight / total_weight) * score for _, weight, score in weighted_parts)
    active_components = {component: score for component, _, score in weighted_parts}

    return min(100, int(round(composite))), active_components


def compute_composite_from_components(components: dict[str, int]) -> int:
    weighted_parts = [
        (component, COMPONENT_WEIGHTS[component], score)
        for component, score in components.items()
        if score > 0 and component in COMPONENT_WEIGHTS
    ]
    if not weighted_parts:
        return 0
    if len(weighted_parts) == 1:
        return weighted_parts[0][2]
    total_weight = sum(weight for _, weight, _ in weighted_parts)
    composite = sum((weight / total_weight) * score for _, weight, score in weighted_parts)
    return min(100, int(round(composite)))
