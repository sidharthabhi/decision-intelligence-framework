from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.employee import Employee
from app.models.performance import MonthlyPerformance
from app.models.suggestion import Suggestion
from app.utils.dependencies import get_current_business

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])

MONTH_SHORT = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
}


@router.get("/dashboard")
def dashboard_stats(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    active_emps = (
        db.query(Employee)
        .filter(
            Employee.business_id == current_business.id,
            Employee.status == "active",
        )
        .all()
    )

    hike = retain = review = 0
    scores: List[float] = []
    missing_banners = []

    for emp in active_emps:
        # latest suggestion
        sug = (
            db.query(Suggestion)
            .filter(Suggestion.employee_id == emp.id)
            .order_by(Suggestion.month.desc())
            .first()
        )
        if sug:
            if sug.suggestion == "Hike":
                hike   += 1
            elif sug.suggestion == "Retain":
                retain += 1
            else:
                review += 1

        # latest score
        perf = (
            db.query(MonthlyPerformance)
            .filter(MonthlyPerformance.employee_id == emp.id)
            .order_by(MonthlyPerformance.month.desc())
            .first()
        )
        if perf and perf.overall_score is not None:
            scores.append(perf.overall_score)

        # missing banner — consecutive_missing >= 1
        if emp.consecutive_missing and emp.consecutive_missing >= 1:
            missing_banners.append({
                "employee_id":        emp.employee_id,
                "name":               emp.name,
                "consecutive_missing":emp.consecutive_missing,
            })

    team_average = round(sum(scores) / len(scores), 1) if scores else 0.0

    # team trend — monthly average across all active employees (last 12 months)
    raw_trend = (
        db.query(
            MonthlyPerformance.month,
            func.avg(MonthlyPerformance.overall_score).label("avg_score"),
        )
        .join(Employee)
        .filter(
            Employee.business_id == current_business.id,
            Employee.status == "active",
        )
        .group_by(MonthlyPerformance.month)
        .order_by(MonthlyPerformance.month)
        .limit(12)
        .all()
    )

    team_trend = []
    for month_str, avg_score in raw_trend:
        parts   = month_str.split("-")
        mon_num = parts[1] if len(parts) == 2 else "01"
        yr      = parts[0] if len(parts) == 2 else "2025"
        team_trend.append({
            "month":         f"{MONTH_SHORT.get(mon_num, mon_num)} {yr}",
            "month_str":     month_str,
            "average_score": round(float(avg_score or 0), 2),
        })

    return {
        "stats": {
            "total_employees":    len(active_emps),
            "hike_count":         hike,
            "retain_count":       retain,
            "under_review_count": review,
            "team_average":       team_average,
        },
        "distribution": {
            "Hike":         hike,
            "Retain":       retain,
            "Under Review": review,
        },
        "team_trend":    team_trend,
        "missing_banners": missing_banners,
    }


@router.get("/employee/{employee_id}/history")
def employee_history(
    employee_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    perfs = (
        db.query(MonthlyPerformance)
        .filter(MonthlyPerformance.employee_id == emp.id)
        .order_by(MonthlyPerformance.month)
        .all()
    )
    sugs = (
        db.query(Suggestion)
        .filter(Suggestion.employee_id == emp.id)
        .order_by(Suggestion.month)
        .all()
    )
    sug_map = {s.month: s for s in sugs}

    history = []
    for p in perfs:
        sug     = sug_map.get(p.month)
        parts   = p.month.split("-")
        mon_num = parts[1] if len(parts) == 2 else "01"
        yr      = parts[0] if len(parts) == 2 else "2025"
        history.append({
            "month":            p.month,
            "month_label":      f"{MONTH_SHORT.get(mon_num, mon_num)} {yr}",
            "score":            p.overall_score,
            "role":             p.role,
            "suggestion":       sug.suggestion       if sug else None,
            "confidence":       sug.confidence_score if sug else None,
            "trend":            sug.trend            if sug else None,
            "metrics":          p.metrics,
            "metric_breakdown": p.metric_breakdown,
        })

    return {
        "employee_id": emp.employee_id,
        "name":        emp.name,
        "role":        emp.role,
        "history":     history,
    }


@router.get("/suggestions-summary")
def suggestions_summary(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Latest suggestion for every active employee — used by dashboard list."""
    active_emps = (
        db.query(Employee)
        .filter(
            Employee.business_id == current_business.id,
            Employee.status == "active",
        )
        .all()
    )

    result = []
    for emp in active_emps:
        sug  = (
            db.query(Suggestion)
            .filter(Suggestion.employee_id == emp.id)
            .order_by(Suggestion.month.desc())
            .first()
        )
        perf = (
            db.query(MonthlyPerformance)
            .filter(MonthlyPerformance.employee_id == emp.id)
            .order_by(MonthlyPerformance.month.desc())
            .first()
        )
        result.append({
            "employee_id":   emp.employee_id,
            "name":          emp.name,
            "role":          emp.role,
            "suggestion":    sug.suggestion        if sug  else None,
            "confidence":    sug.confidence_score  if sug  else None,
            "trend":         sug.trend             if sug  else None,
            "current_score": perf.overall_score    if perf else None,
        })

    return result