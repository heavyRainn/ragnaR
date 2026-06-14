MIN_SNAPSHOTS = 15
MIN_BASELINE_SNAPSHOTS = 14
MIN_BASELINE_RETURNS = 13
MIN_STD_RETURN = 0.001
MAX_STEP_RETURN = 0.15

VOLUME_SHOCK_THRESHOLD = 3.0
PRICE_SHOCK_THRESHOLD = 3.0
QUIET_ACCUMULATION_VOLUME_THRESHOLD = 3.0
QUIET_ACCUMULATION_PRICE_FLAT_THRESHOLD = 2.0


def severity_from_score(score: int) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "significant"
    if score >= 40:
        return "watch"
    return "normal"
