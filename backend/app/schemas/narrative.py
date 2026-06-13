from typing import Literal

from pydantic import BaseModel

NarrativeType = Literal[
    "ACCUMULATION",
    "MOMENTUM_EXPANSION",
    "VOLATILITY_EVENT",
    "MIXED_SIGNAL",
    "NORMAL",
]

NARRATIVE_COPY: dict[str, dict[str, str]] = {
    "ACCUMULATION": {
        "title": "Accumulation detected",
        "description": (
            "Trading volume remains significantly above baseline while price remains "
            "relatively stable. Market attention appears elevated."
        ),
    },
    "MOMENTUM_EXPANSION": {
        "title": "Momentum expansion",
        "description": (
            "Elevated volume coincides with unusual price movement. "
            "Momentum may be accelerating across the market."
        ),
    },
    "VOLATILITY_EVENT": {
        "title": "Volatility event",
        "description": (
            "Price movement is statistically unusual relative to recent baseline. "
            "Volatility expansion detected without broad volume confirmation."
        ),
    },
    "MIXED_SIGNAL": {
        "title": "Mixed market signals",
        "description": (
            "Multiple anomaly patterns detected. Review individual signals "
            "for a complete picture of market behavior."
        ),
    },
    "NORMAL": {
        "title": "Normal market conditions",
        "description": "No significant anomalies detected. Metrics within expected baseline ranges.",
    },
}


class NarrativeOut(BaseModel):
    type: str
    title: str
    description: str
