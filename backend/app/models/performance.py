from sqlalchemy import String, ForeignKey, DateTime, Float, func, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Any
from app.database import Base


class MonthlyPerformance(Base):
    __tablename__ = "monthly_performance"

    id:               Mapped[int]           = mapped_column(primary_key=True, index=True)
    employee_id:      Mapped[int]           = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    month:            Mapped[str]           = mapped_column(String(7),   nullable=False)
    year:             Mapped[int]           = mapped_column(nullable=False)
    role:             Mapped[str]           = mapped_column(String(100), nullable=False)
    metrics:          Mapped[dict]          = mapped_column(JSONB,       nullable=False)
    overall_score:    Mapped[Optional[float]] = mapped_column(Float,     nullable=True)
    metric_breakdown: Mapped[Optional[dict]] = mapped_column(JSONB,      nullable=True)
    uploaded_at:      Mapped[DateTime]      = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="performance_records")

    __table_args__ = (
        UniqueConstraint("employee_id", "month", name="uq_employee_month"),
    )


class UploadHistory(Base):
    __tablename__ = "upload_history"

    id:                   Mapped[int]           = mapped_column(primary_key=True, index=True)
    business_id:          Mapped[int]           = mapped_column(ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    month:                Mapped[str]           = mapped_column(String(7),   nullable=False)
    year:                 Mapped[int]           = mapped_column(nullable=False)
    filename:             Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    employees_processed:  Mapped[int]           = mapped_column(default=0)
    new_employees:        Mapped[int]           = mapped_column(default=0)
    absent_employees:     Mapped[int]           = mapped_column(default=0)
    status:               Mapped[str]           = mapped_column(String(20), default="success")
    uploaded_at:          Mapped[DateTime]      = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    business = relationship("Business", back_populates="upload_history")