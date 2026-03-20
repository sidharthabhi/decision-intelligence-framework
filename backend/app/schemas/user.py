import re
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        errors = []
        if len(v) < 8:
            errors.append("at least 8 characters")
        if not re.search(r"[A-Z]", v):
            errors.append("one uppercase letter")
        if not re.search(r"[0-9]", v):
            errors.append("one number")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            errors.append("one special character")
        if errors:
            raise ValueError("Password must contain: " + ", ".join(errors))
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id:         int
    full_name:  str
    email:      str
    is_active:  bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None