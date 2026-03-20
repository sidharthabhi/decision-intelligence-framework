import io
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.business import Business
from app.models.performance import UploadHistory
from app.services.excel import process_upload, generate_template
from app.utils.dependencies import get_current_business

router = APIRouter(prefix="/api/v1/upload", tags=["Upload"])

MONTH_LABELS = {
    1: "January",  2: "February", 3: "March",    4: "April",
    5: "May",      6: "June",     7: "July",      8: "August",
    9: "September",10: "October", 11: "November", 12: "December",
}


@router.post("")
async def upload_performance(
    file:     UploadFile = File(...),
    month:    int        = Form(...),
    year:     int        = Form(...),
    overwrite:bool       = Form(False),
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    # basic guards
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are accepted")
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be between 1 and 12")
    if not (2020 <= year <= 2030):
        raise HTTPException(status_code=400, detail="Year must be between 2020 and 2030")

    file_bytes = await file.read()

    success, summary, errors = process_upload(
        file_bytes=file_bytes,
        filename=file.filename,
        business_id=current_business.id,
        business_type=current_business.business_type,
        month=month,
        year=year,
        overwrite=overwrite,
        db=db,
        max_mb=5,
    )

    # overwrite confirmation needed
    if not success and isinstance(summary, dict) and summary.get("needs_confirmation"):
        return {
            "needs_overwrite_confirmation": True,
            "message": (
                f"{MONTH_LABELS[month]} {year} already has "
                f"{summary['existing_count']} records. "
                "Send overwrite=true to replace."
            ),
            "month": MONTH_LABELS[month],
            "year":  year,
        }

    # hard validation errors
    if not success:
        raise HTTPException(status_code=422, detail=errors or ["Upload failed"])

    # serialize NameChange objects
    name_changes_out = [
        {
            "employee_id": nc.employee_id,
            "old_name":    nc.old_name,
            "new_name":    nc.new_name,
        }
        if hasattr(nc, "employee_id") else nc
        for nc in summary.get("name_changes", [])
    ]

    return {
        "success": True,
        "message": f"Successfully processed {summary['total_processed']} employees",
        "month":   MONTH_LABELS[month],
        "year":    year,
        "summary": {
            "total_processed":  summary["total_processed"],
            "new_employees":    summary["new_employees"],
            "absent_employees": summary["absent_employees"],
            "two_month_missing":summary["two_month_missing"],
            "name_changes":     name_changes_out,
            "reactivations":    summary["reactivations"],
            "warnings":         errors,
        },
    }


@router.get("/template")
def download_template(
    month: int,
    year:  int,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    """Returns a real downloadable .xlsx template for the current business type."""
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Month must be 1-12")

    excel_bytes = generate_template(
        business_type=current_business.business_type,
        business_name=current_business.business_name,
        month=month,
        year=year,
    )

    # build filename e.g. sunrisepetrol_jan_2025.xlsx
    safe_name = "".join(
        c if c.isalnum() else "_"
        for c in current_business.business_name.lower()
    )[:15]
    mon_short = MONTH_LABELS[month][:3].lower()
    filename  = f"{safe_name}_{mon_short}_{year}.xlsx"

    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/history")
def get_upload_history(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
):
    records = (
        db.query(UploadHistory)
        .filter(UploadHistory.business_id == current_business.id)
        .order_by(UploadHistory.uploaded_at.desc())
        .all()
    )

    result = []
    for r in records:
        parts    = r.month.split("-")
        mon_num  = int(parts[1]) if len(parts) == 2 else 1
        result.append({
            "id":                  r.id,
            "month":               f"{MONTH_LABELS.get(mon_num, r.month)} {r.year}",
            "month_str":           r.month,
            "year":                r.year,
            "filename":            r.filename,
            "employees_processed": r.employees_processed,
            "new_employees":       r.new_employees,
            "absent_employees":    r.absent_employees,
            "status":              r.status,
            "uploaded_at":         r.uploaded_at,
        })

    return result