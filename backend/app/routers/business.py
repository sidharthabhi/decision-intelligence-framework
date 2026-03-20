from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.business import Business
from app.models.employee import Employee
from app.schemas.business import (
    BusinessCreate,
    BusinessUpdate,
    BusinessChangeType,
    BusinessResponse,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/business", tags=["Business"])


# ── helper ────────────────────────────────────────────────────────────────────
def _get_biz_or_404(user_id: int, db: Session) -> Business:
    biz = db.query(Business).filter(Business.user_id == user_id).first()
    if not biz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business not found",
        )
    return biz


# ── endpoints ─────────────────────────────────────────────────────────────────
@router.get("", response_model=BusinessResponse)
def get_business(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_biz_or_404(current_user.id, db)


@router.post("", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
def create_business(
    data: BusinessCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(Business).filter(Business.user_id == current_user.id).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business already exists for this user",
        )

    biz = Business(
        user_id=current_user.id,
        business_name=data.business_name,
        business_type=data.business_type,
        employee_count_estimate=data.employee_count_estimate,
    )
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz


@router.put("", response_model=BusinessResponse)
def update_business(
    data: BusinessUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    biz = _get_biz_or_404(current_user.id, db)

    if data.business_name:
        biz.business_name = data.business_name.strip()
    if data.full_name:
        current_user.full_name = data.full_name.strip()

    db.commit()
    db.refresh(biz)
    return biz


@router.post("/change-type")
def change_business_type(
    data: BusinessChangeType,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # schema already validated confirmation == "DELETE" and new_type is valid
    biz = _get_biz_or_404(current_user.id, db)

    # cascade-delete all employees and their children
    db.query(Employee).filter(
        Employee.business_id == biz.id
    ).delete(synchronize_session=False)

    biz.business_type = data.new_type
    db.commit()

    return {
        "message": f"Business type changed to '{data.new_type}'. All historical data deleted.",
        "new_type": data.new_type,
    }


@router.delete("")
def delete_business(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    biz = _get_biz_or_404(current_user.id, db)
    db.delete(biz)
    db.commit()
    return {"message": "Business and all associated data deleted successfully"}


@router.get("/roles")
def list_roles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns valid roles for the current business type."""
    from app.services.weights import get_roles
    biz = _get_biz_or_404(current_user.id, db)
    return {
        "business_type": biz.business_type,
        "roles": get_roles(biz.business_type),
    }