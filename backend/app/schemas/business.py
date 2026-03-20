from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

VALID_BUSINESS_TYPES = [
    "petrol_bunk",
    "retail_store",
    "electronics_showroom",
    "pharmacy",
    "mall_management",
    "warehouse",
    "small_office",
]

VALID_EMP_COUNTS = ["1-10", "11-25", "26-50", "51+"]


class BusinessCreate(BaseModel):
    business_name:           str
    business_type:           str
    employee_count_estimate: Optional[str] = None

    @field_validator("business_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Business name cannot be empty")
        return v.strip()

    @field_validator("business_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in VALID_BUSINESS_TYPES:
            raise ValueError(
                f"Invalid business type. Must be one of: {', '.join(VALID_BUSINESS_TYPES)}"
            )
        return v

    @field_validator("employee_count_estimate")
    @classmethod
    def valid_count(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_EMP_COUNTS:
            raise ValueError(
                f"Invalid employee count. Must be one of: {', '.join(VALID_EMP_COUNTS)}"
            )
        return v


class BusinessUpdate(BaseModel):
    business_name: Optional[str] = None
    full_name:     Optional[str] = None   # also updates owner's full_name


class BusinessChangeType(BaseModel):
    new_type:     str
    confirmation: str   # must be exactly "DELETE"

    @field_validator("new_type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in VALID_BUSINESS_TYPES:
            raise ValueError(
                f"Invalid business type. Must be one of: {', '.join(VALID_BUSINESS_TYPES)}"
            )
        return v

    @field_validator("confirmation")
    @classmethod
    def must_be_delete(cls, v: str) -> str:
        if v != "DELETE":
            raise ValueError("You must type exactly 'DELETE' to confirm this action")
        return v


class BusinessResponse(BaseModel):
    id:                      int
    user_id:                 int
    business_name:           str
    business_type:           str
    employee_count_estimate: Optional[str]
    created_at:              datetime
    updated_at:              datetime

    model_config = {"from_attributes": True}