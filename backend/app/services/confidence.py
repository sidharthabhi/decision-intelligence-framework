"""
Confidence Calculator
Confidence = 100 - penalties  (floor: 30%)
"""
from typing import Any, Dict, List, Optional

CONFIDENCE_FLOOR = 30.0
SKIP_COLS = {
    "employee_id", "name", "role",
    "days_present", "days_assigned", "manager_rating",
}


def calculate_confidence(
    months_tracked:   int,
    metrics:          Dict[str, Any],
    expected_columns: List[str],
    volatility:       Optional[float],
    red_flags:        List[str],
) -> Dict[str, Any]:
    """
    Returns confidence score and full penalty breakdown.
    Stored in Suggestion.explanation["confidence_detail"].
    """
    penalties: Dict[str, float] = {}

    # 1. history penalty
    if months_tracked == 1:
        penalties["history"] = -40.0
    elif months_tracked == 2:
        penalties["history"] = -20.0
    else:
        penalties["history"] = 0.0

    # 2. missing metric penalty (-10 per missing column)
    missing = [
        col for col in expected_columns
        if col not in SKIP_COLS
        and (col not in metrics or metrics.get(col) is None)
    ]
    penalties["missing_data"] = float(len(missing)) * -10.0

    # 3. volatility penalty
    penalties["volatility"] = -10.0 if (volatility and volatility > 15) else 0.0

    # 4. red flag penalty
    penalties["red_flags"] = -20.0 if red_flags else 0.0

    total_penalty  = sum(penalties.values())
    raw_confidence = 100.0 + total_penalty
    final          = max(CONFIDENCE_FLOOR, raw_confidence)

    return {
        "confidence_score": round(final, 1),
        "base":             100.0,
        "penalties":        penalties,
        "total_penalty":    round(total_penalty, 1),
        "floor_applied":    raw_confidence < CONFIDENCE_FLOOR,
    }