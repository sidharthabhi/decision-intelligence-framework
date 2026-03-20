"""
Scoring Engine
Calculates per-metric scores and weighted overall score.
Returns: (overall_score, metric_breakdown, zero_violation, red_flags)
"""
from typing import Any, Dict, List, Optional, Tuple
from app.services.weights import get_role_config


# ── atomic calculators ────────────────────────────────────────────────────────

def _attendance(m: Dict) -> float:
    dp = float(m.get("days_present", 0) or 0)
    da = float(m.get("days_assigned", 1) or 1)
    return min(100.0, (dp / da) * 100)


def _manager_rating(m: Dict) -> float:
    r = float(m.get("manager_rating", 3) or 3)
    return min(100.0, (r / 5.0) * 100)


def _penalty(m: Dict, col: str, rate: float) -> float:
    val = float(m.get(col, 0) or 0)
    return max(0.0, 100.0 - val * rate)


def _direct(m: Dict, col: str, default: float = 75.0) -> float:
    val = m.get(col)
    if val is None:
        return default
    return min(100.0, max(0.0, float(val)))


def _sales(m: Dict) -> float:
    target   = float(m.get("sales_target",   100) or 100)
    achieved = float(m.get("sales_achieved",   0) or 0)
    return min(100.0, (achieved / target) * 100) if target > 0 else 0.0


# ── metric router ─────────────────────────────────────────────────────────────
# maps weight_key → lambda(metrics, cfg) → float

_HANDLERS: Dict[str, Any] = {
    # universal
    "attendance":     lambda m, c: _attendance(m),
    "manager_rating": lambda m, c: _manager_rating(m),

    # petrol bunk
    "fuel_discipline":   lambda m, c: _penalty(m, "fuel_complaints",     c["penalties"].get("fuel_complaints",    15)),
    "safety_compliance": lambda m, c: _penalty(m, "safety_violations",   c["penalties"].get("safety_violations",  50)),
    "customer_service":  lambda m, c: _penalty(m, "customer_complaints", c["penalties"].get("customer_complaints",10)),
    "speed_accuracy":    lambda m, c: _penalty(m, "billing_errors",      c["penalties"].get("billing_errors",      8)),
    "cash_handling":     lambda m, c: _penalty(m, "cash_mismatch_incidents", c["penalties"].get("cash_mismatch_incidents", 20)),

    # retail / shared
    "billing_accuracy":       lambda m, c: _penalty(m, "billing_errors",  c["penalties"].get("billing_errors",  8)),
    "customer_interaction":   lambda m, c: _penalty(m, "customer_complaints", c["penalties"].get("customer_complaints", 10)),
    "information_accuracy":   lambda m, c: _penalty(m, "information_errors",  c["penalties"].get("information_errors",  20)),
    "sales_performance":      lambda m, c: _sales(m),
    "product_knowledge":      lambda m, c: _penalty(m, "product_knowledge_complaints", c["penalties"].get("product_knowledge_complaints", 15)),
    "merchandising":          lambda m, c: _direct(m, "merchandising_score"),
    "inventory_handling":     lambda m, c: _penalty(m, "inventory_mistakes", c["penalties"].get("inventory_mistakes", 10)),
    "receiving_accuracy":     lambda m, c: _direct(m, "receiving_accuracy_pct"),
    "organization":           lambda m, c: _direct(m, "organization_score"),
    "department_performance": lambda m, c: _direct(m, "dept_sales_pct"),
    "staff_management":       lambda m, c: _penalty(m, "staffing_issues",  c["penalties"].get("staffing_issues",  15)),
    "problem_resolution":     lambda m, c: _penalty(m, "escalated_issues", c["penalties"].get("escalated_issues", 15)),
    "team_performance":       lambda m, c: _direct(m, "team_performance_score"),

    # electronics
    "transaction_speed": lambda m, c: _direct(m, "transaction_speed_score", default=80.0),
    "returns_exchanges": lambda m, c: _penalty(m, "return_errors",      c["penalties"].get("return_errors",      15)),
    "technical_knowledge": lambda m, c: _direct(m, "technical_knowledge_score"),
    "demo_quality":        lambda m, c: _penalty(m, "demo_failures",     c["penalties"].get("demo_failures",     20)),
    "issue_resolution":    lambda m, c: _penalty(m, "unresolved_issues", c["penalties"].get("unresolved_issues", 15)),
    "inventory_accuracy":  lambda m, c: _direct(m, "inventory_accuracy_pct"),
    "product_care":        lambda m, c: _penalty(m, "damage_incidents",  c["penalties"].get("damage_incidents",  20)),
    "overall_sales":       lambda m, c: _direct(m, "store_sales_pct"),
    "customer_satisfaction": lambda m, c: _penalty(m, "customer_complaints", c["penalties"].get("customer_complaints", 10)),

    # pharmacy
    "prescription_accuracy":   lambda m, c: _penalty(m, "prescription_errors", c["penalties"].get("prescription_errors", 100)),
    "drug_interaction_checks": lambda m, c: _penalty(m, "missed_drug_checks",  c["penalties"].get("missed_drug_checks",   25)),
    "patient_counseling":      lambda m, c: _direct(m, "counseling_score"),
    "prescription_processing": lambda m, c: _penalty(m, "processing_errors",   c["penalties"].get("processing_errors",    15)),
    "inventory_management":    lambda m, c: _penalty(m, "expired_item_errors", c["penalties"].get("expired_item_errors",  25)),
    "insurance_processing":    lambda m, c: _penalty(m, "billing_errors",      c["penalties"].get("billing_errors",       10)),
    "stock_accuracy":          lambda m, c: _penalty(m, "stock_discrepancies", c["penalties"].get("stock_discrepancies",  15)),
    "expiry_management":       lambda m, c: _penalty(m, "expired_items_reached_customers", c["penalties"].get("expired_items_reached_customers", 30)),
    "regulatory_compliance":   lambda m, c: _penalty(m, "compliance_issues",   c["penalties"].get("compliance_issues",    20)),
    "overall_safety":          lambda m, c: _penalty(m, "prescription_errors", c["penalties"].get("prescription_errors",  50)),

    # mall management
    "incident_response":     lambda m, c: _penalty(m, "incident_response_delays", c["penalties"].get("incident_response_delays", 20)),
    "safety_vigilance":      lambda m, c: _penalty(m, "missed_hazards",           c["penalties"].get("missed_hazards",           30)),
    "discipline_appearance": lambda m, c: _penalty(m, "discipline_violations",    c["penalties"].get("discipline_violations",    15)),
    "task_completion":       lambda m, c: _direct(m, "task_completion_pct"),
    "resource_management":   lambda m, c: _direct(m, "resource_management_score", default=80.0),
    "response_time":         lambda m, c: _penalty(m, "critical_delays",          c["penalties"].get("critical_delays",          15)),
    "work_quality":          lambda m, c: _direct(m, "work_quality_score"),
    "incident_management":   lambda m, c: _penalty(m, "major_incidents",          c["penalties"].get("major_incidents",          25)),
    "emergency_response":    lambda m, c: _penalty(m, "emergency_failures",       c["penalties"].get("emergency_failures",       40)),
    "cleanliness":           lambda m, c: _direct(m, "cleanliness_score"),
    "cleanliness_standards": lambda m, c: _direct(m, "cleanliness_score"),

    # warehouse
    "equipment_handling":      lambda m, c: _penalty(m, "damage_incidents",        c["penalties"].get("damage_incidents",        25)),
    "productivity":            lambda m, c: _direct(m, "productivity_score"),
    "picking_accuracy":        lambda m, c: _direct(m, "picking_accuracy_pct"),
    "cycle_count_performance": lambda m, c: _penalty(m, "inventory_discrepancies", c["penalties"].get("inventory_discrepancies", 15)),
    "documentation_accuracy":  lambda m, c: _direct(m, "documentation_accuracy_pct"),
    "shipping_accuracy":       lambda m, c: _penalty(m, "shipping_errors",         c["penalties"].get("shipping_errors",         25)),
    "on_time_shipments":       lambda m, c: _direct(m, "on_time_shipments_pct"),
    "team_safety_performance": lambda m, c: _penalty(m, "injury_incidents",        c["penalties"].get("injury_incidents",        50)),

    # small office
    "team_collaboration": lambda m, c: _direct(m, "team_collaboration_score"),
    "initiative":         lambda m, c: _direct(m, "initiative_score"),
}


def _compute(weight_key: str, metrics: Dict, cfg: Dict) -> float:
    handler = _HANDLERS.get(weight_key)
    if handler:
        return round(handler(metrics, cfg), 2)
    # fallback: try direct match in metrics dict
    return _direct(metrics, weight_key)


# ── main entry point ──────────────────────────────────────────────────────────

def calculate_score(
    metrics: Dict,
    business_type: str,
    role: str,
) -> Tuple[float, Dict, Optional[Dict], List[str]]:
    """
    Returns:
        overall_score       float  0-100
        metric_breakdown    dict   {weight_key: {score, weight, weighted}}
        zero_violation      dict | None
        red_flags           list of human-readable strings
    """
    cfg = get_role_config(business_type, role)

    # unknown role — fallback: 60% attendance + 40% manager rating
    if not cfg:
        att    = _attendance(metrics)
        rating = _manager_rating(metrics)
        score  = round(att * 0.6 + rating * 0.4, 2)
        return score, {}, None, []

    weights:    Dict = cfg.get("weights",   {})
    red_flag_rules: Dict = cfg.get("red_flags", {})

    # enrich metrics with derived attendance_pct
    att_pct   = _attendance(metrics)
    enriched  = {**metrics, "attendance_pct": att_pct}

    # ── 1. zero-tolerance check (highest priority) ───────────────────────────
    for col, rule in red_flag_rules.items():
        if not rule.get("zero_tolerance"):
            continue
        val       = float(enriched.get(col, 0) or 0)
        threshold = rule["threshold"]
        triggered = (
            (rule["op"] == "gte" and val >= threshold) or
            (rule["op"] == "lt"  and val <  threshold)
        )
        if triggered:
            zero_violation = {"metric": col, "value": val, "threshold": threshold}
            return 0.0, {}, zero_violation, [
                f"ZERO TOLERANCE: {col.replace('_', ' ').title()} = {val}"
            ]

    # ── 2. regular red flags ─────────────────────────────────────────────────
    red_flags: List[str] = []
    for col, rule in red_flag_rules.items():
        if rule.get("zero_tolerance"):
            continue
        val_raw = enriched.get(col)
        if val_raw is None:
            continue
        val       = float(val_raw or 0)
        threshold = rule["threshold"]
        triggered = (
            (rule["op"] == "gte" and val >= threshold) or
            (rule["op"] == "lt"  and val <  threshold)
        )
        if triggered:
            direction = "below" if rule["op"] == "lt" else "at or above"
            red_flags.append(
                f"{col.replace('_', ' ').title()} {direction} threshold ({val})"
            )

    # ── 3. weighted score ─────────────────────────────────────────────────────
    breakdown: Dict    = {}
    weighted_sum       = 0.0
    total_weight       = 0.0

    for weight_key, weight in weights.items():
        s = _compute(weight_key, enriched, cfg)
        breakdown[weight_key] = {
            "score":    s,
            "weight":   weight,
            "weighted": round(s * weight, 2),
        }
        weighted_sum += s * weight
        total_weight += weight

    overall = round(weighted_sum / total_weight, 2) if total_weight else 0.0
    return overall, breakdown, None, red_flags