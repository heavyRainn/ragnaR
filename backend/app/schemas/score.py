from pydantic import BaseModel


class ScoreBreakdownOut(BaseModel):
    total_score: int
    components: dict[str, int]
