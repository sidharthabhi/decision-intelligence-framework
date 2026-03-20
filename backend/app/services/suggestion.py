"""
Suggestion Generator + Explanation Builder
"""
from typing import Any, Dict, List, Optional


# ── core suggestion logic ─────────────────────────────────────────────────────

def generate_suggestion(
    overall_score:  float,
    trend:          str,
    red_flags:      List[str],
    zero_tolerance: Optional[Dict],
    months_tracked: int,
) -> Dict[str, Any]:
    """
    Returns suggestion dict with label, recommendation, and trigger reason.
    Priority: zero_tolerance > red_flags > score+trend matrix
    """

    # priority 1 — zero tolerance
    if zero_tolerance:
        metric = zero_tolerance.get("metric", "unknown").replace("_", " ").title()
        return {
            "suggestion":       "Under Review",
            "auto_triggered":   "zero_tolerance",
            "explanation_short":f"Zero-tolerance violation: {metric}.",
            "recommendation":   "Immediate review required. Check safety and compliance records.",
        }

    # priority 2 — red flags
    if red_flags:
        return {
            "suggestion":       "Under Review",
            "auto_triggered":   "red_flag",
            "explanation_short":"Red flags detected: " + "; ".join(red_flags[:3]),
            "recommendation":   "Review all risk factors before making any employment decisions.",
        }

    # priority 3 — score + trend matrix
    if overall_score >= 85:
        if trend == "Improving":
            return {
                "suggestion":       "Hike",
                "auto_triggered":   None,
                "explanation_short":"Exceptional performance with consistent improvement.",
                "recommendation":   "Strong candidate for salary hike or promotion.",
            }
        else:   # Stable | Insufficient Data
            return {
                "suggestion":       "Retain",
                "auto_triggered":   None,
                "explanation_short":"High performer maintaining excellent standards.",
                "recommendation":   "Continue current arrangement. Monitor for advancement.",
            }

    elif overall_score >= 70:
        if trend == "Improving":
            return {
                "suggestion":       "Retain",
                "auto_triggered":   None,
                "explanation_short":"Performance improving and meeting expectations.",
                "recommendation":   "Continue monitoring. Consider additional responsibilities.",
            }
        elif trend == "Declining":
            return {
                "suggestion":       "Under Review",
                "auto_triggered":   None,
                "explanation_short":"Performance declining from an acceptable baseline.",
                "recommendation":   "Investigate causes. Consider a performance improvement plan.",
            }
        else:   # Stable | Insufficient Data
            return {
                "suggestion":       "Retain",
                "auto_triggered":   None,
                "explanation_short":"Employee meeting performance expectations.",
                "recommendation":   "Maintain current status. Encourage skill development.",
            }

    else:   # < 70
        return {
            "suggestion":       "Under Review",
            "auto_triggered":   None,
            "explanation_short":f"Performance ({overall_score:.1f}/100) below acceptable threshold.",
            "recommendation":   "Performance improvement plan recommended. Set 30-day checkpoint.",
        }


# ── explanation helpers ───────────────────────────────────────────────────────

def build_strengths(
    metrics:       Dict,
    overall_score: float,
    breakdown:     Dict,
) -> List[str]:
    strengths = []

    att = float(metrics.get("attendance_pct", 0) or 0)
    if att >= 95:
        strengths.append(f"Attendance: {att:.0f}% — Excellent (95%+)")
    elif att >= 85:
        strengths.append(f"Attendance: {att:.0f}% — Good")

    rating = float(metrics.get("manager_rating", 0) or 0)
    if rating >= 4.5:
        strengths.append(f"Manager Rating: {rating}/5 — Outstanding")
    elif rating >= 4.0:
        strengths.append(f"Manager Rating: {rating}/5 — Above Average")

    for key, data in breakdown.items():
        if key in ("attendance", "manager_rating"):
            continue
        if isinstance(data, dict) and data.get("score", 0) >= 90:
            label = key.replace("_", " ").title()
            strengths.append(f"{label}: {data['score']:.0f}/100")

    if overall_score >= 90:
        strengths.append(f"Overall Score: {overall_score:.1f}/100 — Outstanding Performer")
    elif overall_score >= 80:
        strengths.append(f"Overall Score: {overall_score:.1f}/100 — Strong Performer")

    return strengths or ["No notable strengths identified yet — more data needed."]


def build_risk_factors(
    red_flags:  List[str],
    trend_data: Dict,
    overall_score: float,
) -> List[str]:
    risks = list(red_flags)

    if trend_data.get("trend") == "Declining" and not risks:
        risks.append("Performance trending downward over recent months.")
    if overall_score < 50:
        risks.append("Overall score critically low — immediate attention needed.")

    return risks


def build_full_explanation(
    metrics:          Dict,
    overall_score:    float,
    breakdown:        Dict,
    trend_data:       Dict,
    red_flags:        List[str],
    confidence_data:  Dict,
    suggestion_result:Dict,
    months_tracked:   int,
) -> Dict:
    """
    Builds the full JSON blob stored in Suggestion.explanation (JSONB column).
    This is what the frontend reads to render the employee detail panel.
    """
    return {
        "performance_trend":  trend_data,
        "key_strengths":      build_strengths(metrics, overall_score, breakdown),
        "risk_factors":       build_risk_factors(red_flags, trend_data, overall_score),
        "recommendation":     suggestion_result["recommendation"],
        "explanation_short":  suggestion_result["explanation_short"],
        "auto_triggered":     suggestion_result.get("auto_triggered"),
        "confidence_detail":  confidence_data,
        "months_tracked":     months_tracked,
    }


# ── auto note ─────────────────────────────────────────────────────────────────

def get_auto_note(score: float) -> str:
    if score >= 90:
        return "Outstanding performance this month — score above 90. Strong candidate for recognition."
    elif score >= 75:
        return "Satisfactory performance. Consistent work with room for growth in key metrics."
    else:
        return "Performance below target this month. Consider a 1-on-1 review conversation."