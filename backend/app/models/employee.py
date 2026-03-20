from sqlalchemy import (
    Column, Integer, String, ForeignKey,
    DateTime, Date, func, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    id                   = Column(Integer, primary_key=True, index=True)
    business_id          = Column(Integer, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id          = Column(String(50),  nullable=False, index=True)   # user-defined e.g. EMP001
    name                 = Column(String(200), nullable=False)
    role                 = Column(String(100), nullable=False, default="general_staff")
    status               = Column(String(20),  nullable=False, default="active")  # active | inactive
    consecutive_missing  = Column(Integer,     nullable=False, default=0)
    date_joined          = Column(Date, server_default=func.current_date(), nullable=False)
    date_left            = Column(Date, nullable=True)
    created_at           = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at           = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # relationships
    business            = relationship("Business",           back_populates="employees")
    performance_records = relationship("MonthlyPerformance", back_populates="employee", cascade="all, delete-orphan")
    suggestions         = relationship("Suggestion",         back_populates="employee", cascade="all, delete-orphan")
    owner_notes         = relationship("OwnerNote",          back_populates="employee", cascade="all, delete-orphan")

    # employee_id must be unique within the same business
    __table_args__ = (
        UniqueConstraint("business_id", "employee_id", name="uq_business_employee_id"),
    )