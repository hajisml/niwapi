from typing import Literal

RiskLevel = Literal["Low", "Medium", "Critical"]


def vulnerability_score(severity: float, culvert_importance: float, forecasted_rainfall_mm: float) -> float:
    return severity * culvert_importance + forecasted_rainfall_mm * 0.5


def risk_level(score: float) -> RiskLevel:
    if score >= 7:
        return "Critical"
    if score >= 4:
        return "Medium"
    return "Low"
