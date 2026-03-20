from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Dict, Any


class NameChange(BaseModel):
    employee_id: str
    old_name:    str
    new_name:    str


class UploadSummary(BaseModel):
    total_processed:  int
    new_employees:    List[str]        # list of employee_id strings
    absent_employees: List[str]
    two_month_missing:List[str]        # absent for 2+ consecutive months
    name_changes:     List[NameChange]
    reactivations:    List[str]
    warnings:         List[str] = []   # non-fatal row-level issues


class UploadResponse(BaseModel):
    success: bool
    message: str
    month:   str
    year:    int
    summary: UploadSummary


class UploadHistoryItem(BaseModel):
    id:                  int
    month:               str
    year:                int
    filename:            Optional[str]
    employees_processed: int
    new_employees:       int
    absent_employees:    int
    status:              str
    uploaded_at:         datetime

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    stats: Dict[str, Any]            # total, hike, retain, under_review, team_average
    distribution: Dict[str, int]     # {"Hike": N, "Retain": N, "Under Review": N}
    team_trend: List[Dict[str, Any]] # [{month, average_score}, ...]
    missing_banners: List[Dict[str, Any]] # [{employee_id, name, months_missing}, ...]
    