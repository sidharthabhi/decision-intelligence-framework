from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.employee import Employee
from app.models.performance import MonthlyPerformance
from app.models.suggestion import OwnerNote, Suggestion
from app.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, NoteCreate
from app.services.suggestion import get_auto_note
from app.utils.dependencies import get_current_business, get_current_user

router = APIRouter(prefix="/api/v1/employees", tags=["Employees"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _enrich(emp: Employee, db: Session) -> dict:
    """Add current score, suggestion, confidence, trend to an employee row."""
    months_tracked = (
        db.query(func.count(MonthlyPerformance.id))
        .filter(MonthlyPerformance.employee_id == emp.id)
        .scalar() or 0
    )
    latest_perf = (
        db.query(MonthlyPerformance)
        .filter(MonthlyPerformance.employee_id == emp.id)
        .order_by(MonthlyPerformance.month.desc())
        .first()
    )
    latest_sug = (
        db.query(Suggestion)
        .filter(Suggestion.employee_id == emp.id)
        .order_by(Suggestion.month.desc())
        .first()
    )
    return {
        "id":                 emp.id,
        "employee_id":        emp.employee_id,
        "name":               emp.name,
        "role":               emp.role,
        "status":             emp.status,
        "date_joined":        emp.date_joined,
        "date_left":          emp.date_left,
        "months_tracked":     months_tracked,
        "current_score":      latest_perf.overall_score if latest_perf else None,
        "current_suggestion": latest_sug.suggestion     if latest_sug  else None,
        "current_confidence": latest_sug.confidence_score if latest_sug else None,
        "current_trend":      latest_sug.trend           if latest_sug  else None,
    }


def _build_detail(emp: Employee, db: Session) -> dict:
    """Full employee detail — history, suggestion breakdown, notes."""
    perfs = (
        db.query(MonthlyPerformance)
        .filter(MonthlyPerformance.employee_id == emp.id)
        .order_by(MonthlyPerformance.month)
        .all()
    )
    latest_sug = (
        db.query(Suggestion)
        .filter(Suggestion.employee_id == emp.id)
        .order_by(Suggestion.month.desc())
        .first()
    )
    notes = (
        db.query(OwnerNote)
        .filter(OwnerNote.employee_id == emp.id)
        .order_by(OwnerNote.created_at.desc())
        .all()
    )

    MONTH_SHORT = {
        "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
        "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
        "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
    }

    scores = [p.overall_score or 0 for p in perfs]
    perf_history = []
    for i, p in enumerate(perfs):
        parts   = p.month.split("-")
        yr, mon = (parts[0], parts[1]) if len(parts) == 2 else ("2025", "01")
        prev    = scores[i - 1] if i > 0 else scores[i]
        curr    = scores[i]
        arrow   = "↗" if curr > prev else ("↘" if curr < prev else "→")
        dp      = (p.metrics or {}).get("days_present", 0) or 0
        da      = (p.metrics or {}).get("days_assigned", 1) or 1
        att     = round(float(dp) / float(da) * 100, 1) if float(da) else 0
        perf_history.append({
            "month":        f"{MONTH_SHORT.get(mon, mon)} {yr}",
            "month_str":    p.month,
            "score":        curr,
            "attendance":   att,
            "trend_arrow":  arrow,
            "role":         p.role,
        })

    sug_detail = None
    if latest_sug:
        sug_detail = {
            "suggestion":      latest_sug.suggestion,
            "confidence_score":latest_sug.confidence_score,
            "trend":           latest_sug.trend,
            "auto_triggered":  latest_sug.auto_triggered,
            "explanation":     latest_sug.explanation or {},
            "red_flags":       latest_sug.red_flags   or [],
            "month":           latest_sug.month,
        }

    notes_out = [
        {
            "id":         n.id,
            "note":       n.note,
            "month":      n.month,
            "year":       n.year,
            "created_at": n.created_at,
        }
        for n in notes
    ]

    latest_score = scores[-1] if scores else 0.0

    return {
        "id":                  emp.id,
        "employee_id":         emp.employee_id,
        "name":                emp.name,
        "role":                emp.role,
        "status":              emp.status,
        "date_joined":         emp.date_joined,
        "date_left":           emp.date_left,
        "months_tracked":      len(perfs),
        "current_score":       latest_score,
        "current_suggestion":  latest_sug.suggestion       if latest_sug else None,
        "current_confidence":  latest_sug.confidence_score if latest_sug else None,
        "current_trend":       latest_sug.trend            if latest_sug else None,
        "performance_history": perf_history,
        "suggestion_detail":   sug_detail,
        "owner_notes":         notes_out,
        "auto_note":           get_auto_note(latest_score) if latest_score else None,
    }


# ── LIST ──────────────────────────────────────────────────────────────────────

@router.get("")
def list_employees(
    emp_status: Optional[str] = Query(None,  alias="status"),
    suggestion: Optional[str] = Query(None),
    search:     Optional[str] = Query(None),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    q = db.query(Employee).filter(Employee.business_id == current_business.id)

    # default to active only unless explicitly requested
    if emp_status:
        q = q.filter(Employee.status == emp_status)
    else:
        q = q.filter(Employee.status == "active")

    # search by name or employee_id
    if search:
        pattern = f"%{search}%"
        q = q.filter(
            (Employee.name.ilike(pattern)) |
            (Employee.employee_id.ilike(pattern))
        )

    employees = q.order_by(Employee.employee_id).all()
    enriched  = [_enrich(e, db) for e in employees]

    # filter by suggestion after enriching (avoids complex subquery)
    if suggestion and suggestion.lower() != "all":
        enriched = [
            e for e in enriched
            if e.get("current_suggestion") == suggestion
        ]

    return enriched


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED)
def create_employee(
    data: EmployeeCreate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    from app.services.weights import get_roles
    valid_roles = get_roles(current_business.business_type)

    if data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{data.role}'. Valid roles for {current_business.business_type}: {', '.join(valid_roles)}",
        )

    existing = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == data.employee_id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{data.employee_id}' already exists in this business",
        )

    emp = Employee(
        business_id=current_business.id,
        employee_id=data.employee_id,
        name=data.name,
        role=data.role,
        status="active",
        consecutive_missing=0,
        date_joined=date.today(),
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    return {
        "message":     f"Employee {data.employee_id} added successfully",
        "id":          emp.id,
        "employee_id": emp.employee_id,
    }


# ── DETAIL ────────────────────────────────────────────────────────────────────

@router.get("/{employee_id}")
def get_employee(
    employee_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()

    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee '{employee_id}' not found",
        )
    return _build_detail(emp, db)


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{employee_id}")
def update_employee(
    employee_id: str,
    data: EmployeeUpdate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{employee_id}' not found")

    if data.name:
        emp.name = data.name.strip()
    if data.role:
        from app.services.weights import get_roles
        valid_roles = get_roles(current_business.business_type)
        if data.role not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role. Valid roles: {', '.join(valid_roles)}",
            )
        emp.role = data.role

    db.commit()
    return {"message": "Employee updated successfully"}


# ── STATUS ────────────────────────────────────────────────────────────────────

@router.post("/{employee_id}/inactive")
def mark_inactive(
    employee_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{employee_id}' not found")

    emp.status    = "inactive"
    emp.date_left = date.today()
    db.commit()
    return {"message": f"{employee_id} marked as inactive"}


@router.post("/{employee_id}/reactivate")
def reactivate(
    employee_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{employee_id}' not found")

    emp.status              = "active"
    emp.date_left           = None
    emp.consecutive_missing = 0
    db.commit()
    return {"message": f"{employee_id} reactivated successfully"}


# ── NOTES ─────────────────────────────────────────────────────────────────────

@router.get("/{employee_id}/notes")
def get_notes(
    employee_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{employee_id}' not found")

    notes = (
        db.query(OwnerNote)
        .filter(OwnerNote.employee_id == emp.id)
        .order_by(OwnerNote.created_at.desc())
        .all()
    )
    return [
        {
            "id":         n.id,
            "note":       n.note,
            "month":      n.month,
            "year":       n.year,
            "created_at": n.created_at,
        }
        for n in notes
    ]


@router.post("/{employee_id}/notes", status_code=status.HTTP_201_CREATED)
def add_note(
    employee_id: str,
    data: NoteCreate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{employee_id}' not found")

    note = OwnerNote(
        employee_id=emp.id,
        note=data.note,
        month=data.month,
        year=data.year,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"id": note.id, "message": "Note added successfully"}


@router.delete("/{employee_id}/notes/{note_id}")
def delete_note(
    employee_id: str,
    note_id: int,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(
        Employee.business_id == current_business.id,
        Employee.employee_id == employee_id.upper(),
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee '{employee_id}' not found")

    note = db.query(OwnerNote).filter(
        OwnerNote.id          == note_id,
        OwnerNote.employee_id == emp.id,
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}