"""
Single source of truth for all scoring configuration.
7 business types × all roles.

Each role entry has:
  weights  – metric_key → float  (must sum to 1.0)
  penalties – metric_key → points deducted per incident from 100
  red_flags – metric_key → {op: "gte"|"lt", threshold: N, zero_tolerance: bool}
  columns  – required Excel columns for this role
"""

BUSINESS_CONFIG: dict = {

    # ─── PETROL BUNK ──────────────────────────────────────────────────────────
    "petrol_bunk": {
        "fuel_attendant": {
            "weights": {
                "fuel_discipline":   0.35,
                "safety_compliance": 0.25,
                "attendance":        0.20,
                "customer_service":  0.15,
                "manager_rating":    0.05,
            },
            "penalties": {
                "fuel_complaints":     15,
                "safety_violations":   50,
                "customer_complaints": 10,
            },
            "red_flags": {
                "fuel_complaints":     {"op": "gte", "threshold": 2},
                "safety_violations":   {"op": "gte", "threshold": 1, "zero_tolerance": True},
                "attendance_pct":      {"op": "lt",  "threshold": 70},
                "customer_complaints": {"op": "gte", "threshold": 3},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "fuel_complaints", "safety_violations", "customer_complaints",
            ],
        },
        "cashier": {
            "weights": {
                "cash_handling":    0.35,
                "attendance":       0.25,
                "speed_accuracy":   0.20,
                "customer_service": 0.15,
                "manager_rating":   0.05,
            },
            "penalties": {
                "cash_mismatch_incidents": 20,
                "billing_errors":          10,
                "customer_complaints":     10,
            },
            "red_flags": {
                "cash_mismatch_incidents": {"op": "gte", "threshold": 4},
                "billing_errors":          {"op": "gte", "threshold": 3},
                "attendance_pct":          {"op": "lt",  "threshold": 70},
                "customer_complaints":     {"op": "gte", "threshold": 3},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "cash_mismatch_incidents", "billing_errors", "customer_complaints",
            ],
        },
        "service_manager": {
            "weights": {
                "team_performance":   0.30,
                "problem_resolution": 0.25,
                "attendance":         0.20,
                "safety_compliance":  0.15,
                "manager_rating":     0.10,
            },
            "penalties": {
                "escalated_issues":        15,
                "major_safety_violations": 30,
            },
            "red_flags": {
                "escalated_issues":        {"op": "gte", "threshold": 3},
                "major_safety_violations": {"op": "gte", "threshold": 2},
                "attendance_pct":          {"op": "lt",  "threshold": 75},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "team_performance_score", "escalated_issues", "major_safety_violations",
            ],
        },
        "cleaner": {
            "weights": {
                "cleanliness":     0.40,
                "attendance":      0.30,
                "task_completion": 0.20,
                "manager_rating":  0.10,
            },
            "penalties": {
                "cleanliness_failures": 20,
            },
            "red_flags": {
                "cleanliness_failures": {"op": "gte", "threshold": 2},
                "attendance_pct":       {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "cleanliness_score", "task_completion_pct", "cleanliness_failures",
            ],
        },
    },

    # ─── RETAIL STORE ─────────────────────────────────────────────────────────
    "retail_store": {
        "cashier": {
            "weights": {
                "cash_handling":    0.30,
                "billing_accuracy": 0.25,
                "speed_accuracy":   0.20,
                "attendance":       0.10,
                "customer_service": 0.10,
                "manager_rating":   0.05,
            },
            "penalties": {
                "cash_mismatch_incidents": 15,
                "billing_errors":          8,
                "customer_complaints":     10,
            },
            "red_flags": {
                "cash_mismatch_incidents": {"op": "gte", "threshold": 4},
                "billing_errors":          {"op": "gte", "threshold": 5},
                "attendance_pct":          {"op": "lt",  "threshold": 70},
                "customer_complaints":     {"op": "gte", "threshold": 3},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "cash_mismatch_incidents", "billing_errors", "customer_complaints",
            ],
        },
        "sales_associate": {
            "weights": {
                "customer_interaction": 0.30,
                "product_knowledge":    0.25,
                "sales_performance":    0.20,
                "attendance":           0.10,
                "merchandising":        0.10,
                "manager_rating":       0.05,
            },
            "penalties": {
                "customer_complaints": 10,
            },
            "red_flags": {
                "customer_complaints": {"op": "gte", "threshold": 3},
                "sales_target_pct":    {"op": "lt",  "threshold": 60},
                "attendance_pct":      {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "customer_complaints", "product_knowledge_score",
                "sales_target", "sales_achieved", "merchandising_score",
            ],
        },
        "inventory_staff": {
            "weights": {
                "inventory_handling": 0.35,
                "receiving_accuracy": 0.25,
                "attendance":         0.20,
                "organization":       0.10,
                "manager_rating":     0.10,
            },
            "penalties": {
                "inventory_mistakes": 10,
            },
            "red_flags": {
                "inventory_mistakes": {"op": "gte", "threshold": 5},
                "attendance_pct":     {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "inventory_mistakes", "receiving_accuracy_pct", "organization_score",
            ],
        },
        "department_manager": {
            "weights": {
                "department_performance": 0.30,
                "staff_management":       0.25,
                "attendance":             0.20,
                "problem_resolution":     0.15,
                "manager_rating":         0.10,
            },
            "penalties": {
                "staffing_issues": 15,
            },
            "red_flags": {
                "dept_sales_pct":  {"op": "lt",  "threshold": 70},
                "staffing_issues": {"op": "gte", "threshold": 3},
                "attendance_pct":  {"op": "lt",  "threshold": 75},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "dept_sales_pct", "staffing_issues", "problem_resolution_score",
            ],
        },
    },

    # ─── ELECTRONICS SHOWROOM ─────────────────────────────────────────────────
    "electronics_showroom": {
        "sales_associate": {
            "weights": {
                "sales_performance":    0.30,
                "product_knowledge":    0.25,
                "customer_interaction": 0.20,
                "attendance":           0.15,
                "manager_rating":       0.10,
            },
            "penalties": {
                "product_knowledge_complaints": 15,
                "customer_complaints":          10,
            },
            "red_flags": {
                "sales_target_pct":             {"op": "lt",  "threshold": 60},
                "product_knowledge_complaints": {"op": "gte", "threshold": 3},
                "customer_complaints":          {"op": "gte", "threshold": 3},
                "attendance_pct":               {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "sales_target", "sales_achieved",
                "product_knowledge_complaints", "customer_complaints",
            ],
        },
        "cashier": {
            "weights": {
                "cash_handling":     0.30,
                "transaction_speed": 0.25,
                "returns_exchanges": 0.20,
                "attendance":        0.15,
                "manager_rating":    0.10,
            },
            "penalties": {
                "cash_mismatch_incidents": 15,
                "return_errors":           15,
            },
            "red_flags": {
                "cash_mismatch_incidents": {"op": "gte", "threshold": 4},
                "return_errors":           {"op": "gte", "threshold": 3},
                "attendance_pct":          {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "cash_mismatch_incidents", "return_errors",
            ],
        },
        "technical_support": {
            "weights": {
                "technical_knowledge": 0.35,
                "demo_quality":        0.25,
                "issue_resolution":    0.20,
                "attendance":          0.10,
                "manager_rating":      0.10,
            },
            "penalties": {
                "demo_failures":     20,
                "unresolved_issues": 15,
            },
            "red_flags": {
                "technical_knowledge_score": {"op": "lt",  "threshold": 70},
                "demo_failures":             {"op": "gte", "threshold": 2},
                "attendance_pct":            {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "technical_knowledge_score", "demo_failures", "unresolved_issues",
            ],
        },
        "inventory_staff": {
            "weights": {
                "inventory_accuracy": 0.35,
                "receiving_accuracy": 0.25,
                "attendance":         0.20,
                "product_care":       0.10,
                "manager_rating":     0.10,
            },
            "penalties": {
                "inventory_mistakes": 10,
                "damage_incidents":   20,
            },
            "red_flags": {
                "inventory_mistakes": {"op": "gte", "threshold": 5},
                "damage_incidents":   {"op": "gte", "threshold": 2},
                "attendance_pct":     {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "inventory_mistakes", "damage_incidents",
            ],
        },
        "store_manager": {
            "weights": {
                "overall_sales":         0.30,
                "team_performance":      0.25,
                "customer_satisfaction": 0.20,
                "attendance":            0.15,
                "manager_rating":        0.10,
            },
            "penalties": {
                "customer_complaints": 10,
            },
            "red_flags": {
                "store_sales_pct":     {"op": "lt",  "threshold": 70},
                "customer_complaints": {"op": "gte", "threshold": 3},
                "attendance_pct":      {"op": "lt",  "threshold": 75},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "store_sales_pct", "team_performance_score", "customer_complaints",
            ],
        },
    },

    # ─── PHARMACY ─────────────────────────────────────────────────────────────
    "pharmacy": {
        "pharmacist": {
            "weights": {
                "prescription_accuracy":   0.40,
                "drug_interaction_checks": 0.20,
                "patient_counseling":      0.15,
                "attendance":              0.15,
                "manager_rating":          0.10,
            },
            "penalties": {
                "prescription_errors": 100,   # zero-tolerance
                "missed_drug_checks":   25,
                "patient_complaints":   10,
            },
            "red_flags": {
                "prescription_errors": {"op": "gte", "threshold": 1, "zero_tolerance": True},
                "missed_drug_checks":  {"op": "gte", "threshold": 2},
                "patient_complaints":  {"op": "gte", "threshold": 3},
                "attendance_pct":      {"op": "lt",  "threshold": 75},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "prescription_errors", "missed_drug_checks",
                "patient_complaints", "counseling_score",
            ],
        },
        "pharmacy_technician": {
            "weights": {
                "prescription_processing": 0.30,
                "inventory_management":    0.25,
                "insurance_processing":    0.20,
                "attendance":              0.15,
                "manager_rating":          0.10,
            },
            "penalties": {
                "processing_errors":   15,
                "expired_item_errors": 25,
                "billing_errors":      10,
            },
            "red_flags": {
                "processing_errors":   {"op": "gte", "threshold": 3},
                "expired_item_errors": {"op": "gte", "threshold": 2},
                "billing_errors":      {"op": "gte", "threshold": 4},
                "attendance_pct":      {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "processing_errors", "expired_item_errors", "billing_errors",
            ],
        },
        "cashier": {
            "weights": {
                "billing_accuracy":  0.35,
                "customer_service":  0.25,
                "transaction_speed": 0.20,
                "attendance":        0.15,
                "manager_rating":    0.05,
            },
            "penalties": {
                "billing_errors":      10,
                "customer_complaints": 10,
            },
            "red_flags": {
                "billing_errors":      {"op": "gte", "threshold": 4},
                "customer_complaints": {"op": "gte", "threshold": 3},
                "attendance_pct":      {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "billing_errors", "customer_complaints",
            ],
        },
        "inventory_staff": {
            "weights": {
                "stock_accuracy":     0.35,
                "expiry_management":  0.30,
                "receiving_accuracy": 0.20,
                "attendance":         0.10,
                "manager_rating":     0.05,
            },
            "penalties": {
                "stock_discrepancies":             15,
                "expired_items_reached_customers": 30,
            },
            "red_flags": {
                "stock_discrepancies":             {"op": "gte", "threshold": 3},
                "expired_items_reached_customers": {"op": "gte", "threshold": 2},
                "attendance_pct":                  {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "stock_discrepancies", "expired_items_reached_customers",
                "receiving_accuracy_pct",
            ],
        },
        "store_manager": {
            "weights": {
                "overall_safety":        0.30,
                "team_performance":      0.25,
                "regulatory_compliance": 0.20,
                "customer_satisfaction": 0.15,
                "manager_rating":        0.10,
            },
            "penalties": {
                "prescription_errors": 50,
                "compliance_issues":   20,
                "customer_complaints": 10,
            },
            "red_flags": {
                "prescription_errors": {"op": "gte", "threshold": 1},
                "compliance_issues":   {"op": "gte", "threshold": 2},
                "customer_complaints": {"op": "gte", "threshold": 3},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "prescription_errors", "compliance_issues", "customer_complaints",
            ],
        },
    },

    # ─── MALL MANAGEMENT ──────────────────────────────────────────────────────
    "mall_management": {
        "security_personnel": {
            "weights": {
                "attendance":            0.25,
                "incident_response":     0.25,
                "safety_vigilance":      0.20,
                "discipline_appearance": 0.15,
                "task_completion":       0.15,
            },
            "penalties": {
                "incident_response_delays": 20,
                "missed_hazards":           30,
                "discipline_violations":    15,
            },
            "red_flags": {
                "attendance_pct":           {"op": "lt",  "threshold": 70},
                "incident_response_delays": {"op": "gte", "threshold": 2},
                "missed_hazards":           {"op": "gte", "threshold": 1},
                "discipline_violations":    {"op": "gte", "threshold": 3},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "incident_response_delays", "missed_hazards",
                "discipline_violations", "task_completion_pct",
            ],
        },
        "housekeeping_staff": {
            "weights": {
                "attendance":            0.25,
                "cleanliness_standards": 0.30,
                "task_completion":       0.20,
                "resource_management":   0.15,
                "customer_interaction":  0.10,
            },
            "penalties": {
                "failed_inspections":  15,
                "customer_complaints": 15,
            },
            "red_flags": {
                "attendance_pct":      {"op": "lt",  "threshold": 70},
                "failed_inspections":  {"op": "gte", "threshold": 3},
                "customer_complaints": {"op": "gte", "threshold": 2},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "failed_inspections", "customer_complaints",
                "cleanliness_score", "task_completion_pct",
            ],
        },
        "front_desk_staff": {
            "weights": {
                "attendance":           0.25,
                "customer_interaction": 0.30,
                "information_accuracy": 0.25,
                "task_completion":      0.15,
                "emergency_response":   0.05,
            },
            "penalties": {
                "customer_complaints": 10,
                "information_errors":  20,
                "emergency_failures":  40,
            },
            "red_flags": {
                "attendance_pct":      {"op": "lt",  "threshold": 70},
                "customer_complaints": {"op": "gte", "threshold": 3},
                "information_errors":  {"op": "gte", "threshold": 2},
                "emergency_failures":  {"op": "gte", "threshold": 1},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "customer_complaints", "information_errors",
                "emergency_failures", "task_completion_pct",
            ],
        },
        "maintenance_technician": {
            "weights": {
                "attendance":          0.20,
                "response_time":       0.25,
                "work_quality":        0.25,
                "safety_compliance":   0.20,
                "resource_management": 0.10,
            },
            "penalties": {
                "critical_delays":   15,
                "rework_incidents":  20,
                "safety_violations": 40,
            },
            "red_flags": {
                "attendance_pct":    {"op": "lt",  "threshold": 70},
                "critical_delays":   {"op": "gte", "threshold": 3},
                "rework_incidents":  {"op": "gte", "threshold": 2},
                "safety_violations": {"op": "gte", "threshold": 1},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "critical_delays", "rework_incidents",
                "safety_violations", "work_quality_score",
            ],
        },
        "mall_supervisor": {
            "weights": {
                "team_performance":      0.30,
                "incident_management":   0.25,
                "attendance":            0.20,
                "customer_satisfaction": 0.15,
                "task_completion":       0.10,
            },
            "penalties": {
                "major_incidents":      25,
                "escalated_complaints": 15,
            },
            "red_flags": {
                "major_incidents":      {"op": "gte", "threshold": 2},
                "escalated_complaints": {"op": "gte", "threshold": 3},
                "attendance_pct":       {"op": "lt",  "threshold": 75},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "major_incidents", "escalated_complaints",
                "team_performance_score", "task_completion_pct",
            ],
        },
    },

    # ─── WAREHOUSE ────────────────────────────────────────────────────────────
    "warehouse": {
        "forklift_operator": {
            "weights": {
                "safety_compliance":  0.35,
                "equipment_handling": 0.25,
                "productivity":       0.20,
                "attendance":         0.15,
                "manager_rating":     0.05,
            },
            "penalties": {
                "safety_violations": 100,   # zero-tolerance
                "damage_incidents":   25,
            },
            "red_flags": {
                "safety_violations": {"op": "gte", "threshold": 1, "zero_tolerance": True},
                "damage_incidents":  {"op": "gte", "threshold": 2},
                "attendance_pct":    {"op": "lt",  "threshold": 75},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "safety_violations", "damage_incidents", "productivity_score",
            ],
        },
        "picker_packer": {
            "weights": {
                "picking_accuracy": 0.35,
                "product_care":     0.25,
                "productivity":     0.20,
                "attendance":       0.15,
                "manager_rating":   0.05,
            },
            "penalties": {
                "picking_errors": 10,
                "damaged_items":  15,
            },
            "red_flags": {
                "picking_accuracy_pct": {"op": "lt",  "threshold": 90},
                "damaged_items":        {"op": "gte", "threshold": 3},
                "attendance_pct":       {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "picking_accuracy_pct", "picking_errors",
                "damaged_items", "productivity_score",
            ],
        },
        "inventory_clerk": {
            "weights": {
                "inventory_accuracy":      0.35,
                "cycle_count_performance": 0.25,
                "documentation_accuracy":  0.20,
                "attendance":              0.15,
                "manager_rating":          0.05,
            },
            "penalties": {
                "inventory_discrepancies": 15,
                "reporting_errors":        20,
            },
            "red_flags": {
                "inventory_accuracy_pct":  {"op": "lt",  "threshold": 95},
                "inventory_discrepancies": {"op": "gte", "threshold": 3},
                "reporting_errors":        {"op": "gte", "threshold": 2},
                "attendance_pct":          {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "inventory_accuracy_pct", "inventory_discrepancies",
                "reporting_errors",
            ],
        },
        "receiving_shipping": {
            "weights": {
                "receiving_accuracy":     0.30,
                "shipping_accuracy":      0.25,
                "documentation_accuracy": 0.20,
                "attendance":             0.15,
                "manager_rating":         0.10,
            },
            "penalties": {
                "receiving_errors": 20,
                "shipping_errors":  25,
            },
            "red_flags": {
                "receiving_errors":           {"op": "gte", "threshold": 2},
                "shipping_errors":            {"op": "gte", "threshold": 2},
                "documentation_accuracy_pct": {"op": "lt",  "threshold": 90},
                "attendance_pct":             {"op": "lt",  "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "receiving_errors", "shipping_errors",
                "documentation_accuracy_pct",
            ],
        },
        "warehouse_supervisor": {
            "weights": {
                "team_safety_performance": 0.30,
                "inventory_accuracy":      0.25,
                "on_time_shipments":       0.20,
                "attendance":              0.15,
                "manager_rating":          0.10,
            },
            "penalties": {
                "injury_incidents": 50,
            },
            "red_flags": {
                "injury_incidents":       {"op": "gte", "threshold": 1},
                "inventory_accuracy_pct": {"op": "lt",  "threshold": 92},
                "attendance_pct":         {"op": "lt",  "threshold": 75},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "injury_incidents", "inventory_accuracy_pct",
                "on_time_shipments_pct",
            ],
        },
    },

    # ─── SMALL OFFICE ─────────────────────────────────────────────────────────
    "small_office": {
        "general_staff": {
            "weights": {
                "attendance":         0.30,
                "task_completion":    0.25,
                "team_collaboration": 0.20,
                "manager_rating":     0.15,
                "initiative":         0.10,
            },
            "penalties": {},
            "red_flags": {
                "attendance_pct":      {"op": "lt", "threshold": 70},
                "task_completion_pct": {"op": "lt", "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "task_completion_pct", "team_collaboration_score",
                "initiative_score",
            ],
        },
        "manager": {
            "weights": {
                "attendance":         0.25,
                "team_performance":   0.30,
                "task_completion":    0.25,
                "manager_rating":     0.20,
            },
            "penalties": {},
            "red_flags": {
                "attendance_pct":      {"op": "lt", "threshold": 75},
                "task_completion_pct": {"op": "lt", "threshold": 70},
            },
            "columns": [
                "employee_id", "name", "role",
                "days_present", "days_assigned", "manager_rating",
                "task_completion_pct", "team_performance_score",
            ],
        },
    },
}


# ── helpers ───────────────────────────────────────────────────────────────────

def get_roles(business_type: str) -> list:
    return list(BUSINESS_CONFIG.get(business_type, {}).keys())


def get_role_config(business_type: str, role: str) -> dict:
    return BUSINESS_CONFIG.get(business_type, {}).get(role, {})


def get_expected_columns(business_type: str, role: str) -> list:
    cfg = get_role_config(business_type, role)
    return cfg.get("columns", [
        "employee_id", "name", "role",
        "days_present", "days_assigned", "manager_rating",
    ])