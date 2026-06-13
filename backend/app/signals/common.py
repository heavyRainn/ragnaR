BASELINE_SNAPSHOT_COUNT = 5
MIN_BASELINE_SNAPSHOTS = 2


def severity_from_score(score: int) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "significant"
    if score >= 40:
        return "watch"
    return "normal"
