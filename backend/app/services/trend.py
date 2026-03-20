"""
Trend Analyzer — pure Python, no numpy required.
Uses simple OLS linear regression.
"""
from typing import Any, Dict, List, Optional


def _slope(scores: List[float]) -> float:
    """OLS slope through (0, s0), (1, s1), ..., (n-1, sn-1)."""
    n = len(scores)
    if n < 2:
        return 0.0
    x_sum  = n * (n - 1) / 2
    y_sum  = sum(scores)
    xy_sum = sum(i * s for i, s in enumerate(scores))
    xx_sum = sum(i * i for i in range(n))
    denom  = n * xx_sum - x_sum ** 2
    return (n * xy_sum - x_sum * y_sum) / denom if denom else 0.0


def _volatility(scores: List[float]) -> float:
    if len(scores) < 2:
        return 0.0
    avg = sum(scores) / len(scores)
    return round(((max(scores) - min(scores)) / avg) * 100, 2) if avg else 0.0


def _vol_label(v: float) -> str:
    if v < 5:   return "Low"
    if v < 15:  return "Medium"
    return "High"


def analyze_trend(performance_history: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Args:
        performance_history: [{"month": "2025-01", "score": 88.5}, ...]
                             sorted oldest → newest

    Returns full trend dict stored in Suggestion.explanation
    """
    n = len(performance_history)

    if n == 0:
        return {
            "trend":           "Insufficient Data",
            "months_tracked":  0,
            "months_needed":   3,
            "slope":           None,
            "volatility":      None,
            "volatility_level":None,
            "current_score":   None,
            "avg_score":       None,
            "avg_3month":      None,
            "change_pct":      None,
        }

    scores  = [float(r.get("score") or 0) for r in performance_history]
    current = scores[-1]
    avg_all = round(sum(scores) / n, 2)

    recent_3  = scores[-3:] if n >= 3 else scores
    avg_3month = round(sum(recent_3) / len(recent_3), 2)

    if n < 3:
        return {
            "trend":            "Insufficient Data",
            "months_tracked":   n,
            "months_needed":    3 - n,
            "slope":            None,
            "volatility":       None,
            "volatility_level": None,
            "current_score":    round(current, 2),
            "avg_score":        avg_all,
            "avg_3month":       avg_3month,
            "change_pct":       None,
        }

    slope = round(_slope(scores), 2)
    vol   = _volatility(scores[-3:])

    if vol > 15:
        trend = "Insufficient Data"
    elif slope > 0.5 and current > avg_3month:
        trend = "Improving"
    elif slope < -0.5 and current < avg_3month:
        trend = "Declining"
    elif abs(slope) <= 0.5 or vol < 10:
        trend = "Stable"
    else:
        trend = "Insufficient Data"

    change_pct = round(((current - avg_3month) / avg_3month) * 100, 1) if avg_3month else 0.0

    return {
        "trend":            trend,
        "months_tracked":   n,
        "months_needed":    0,
        "slope":            slope,
        "volatility":       vol,
        "volatility_level": _vol_label(vol),
        "current_score":    round(current, 2),
        "avg_score":        avg_all,
        "avg_3month":       avg_3month,
        "change_pct":       change_pct,
    }