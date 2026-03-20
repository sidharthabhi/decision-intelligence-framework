from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional, List, Any, Dict


class EmployeeCreate(BaseModel):
    employee_id: str
    name:        str
    role:        str

    @field_validator("employee_id")
    @classmethod
    def clean_id(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Employee ID cannot be empty")
        return v

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("role")
    @classmethod
    def clean_role(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Role cannot be empty")
        return v.strip().lower().replace(" ", "_")


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None


class EmployeeListItem(BaseModel):
    id:                 int
    employee_id:        str
    name:               str
    role:               str
    status:             str
    date_joined:        date
    date_left:          Optional[date]
    months_tracked:     int
    current_score:      Optional[float]
    current_suggestion: Optional[str]
    current_confidence: Optional[float]
    current_trend:      Optional[str]

    model_config = {"from_attributes": True}


class EmployeeDetailResponse(BaseModel):
    id:                 int
    employee_id:        str
    name:               str
    role:               str
    status:             str
    date_joined:        date
    date_left:          Optional[date]
    months_tracked:     int
    current_score:      Optional[float]
    current_suggestion: Optional[str]
    current_confidence: Optional[float]
    current_trend:      Optional[str]
    performance_history: List[Dict[str, Any]]
    suggestion_detail:   Optional[Dict[str, Any]]
    owner_notes:         List[Dict[str, Any]]
    auto_note:           Optional[str]

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    note:  str
    month: Optional[str] = None   # e.g. "2025-01"
    year:  Optional[int] = None

    @field_validator("note")
    @classmethod
    def note_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Note cannot be empty")
        return v.strip()