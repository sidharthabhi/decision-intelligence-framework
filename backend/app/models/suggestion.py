from sqlalchemy import String, ForeignKey, DateTime, Float, Text, func, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional
from app.database import Base


class Suggestion(Base):
    __tablename__ = "suggestions"

    id:               Mapped[int]           = mapped_column(primary_key=True, index=True)
    employee_id:      Mapped[int]           = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    month:            Mapped[str]           = mapped_column(String(7),  nullable=False)
    year:             Mapped[int]           = mapped_column(nullable=False)
    suggestion:       Mapped[str]           = mapped_column(String(50), nullable=False)
    confidence_score: Mapped[float]         = mapped_column(Float,      nullable=False)
    trend:            Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    explanation:      Mapped[Optional[dict]]= mapped_column(JSONB,      nullable=True)
    red_flags:        Mapped[Optional[list]]= mapped_column(JSONB,      nullable=True)
    auto_triggered:   Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    created_at:       Mapped[DateTime]      = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="suggestions")

    __table_args__ = (
        UniqueConstraint("employee_id", "month", name="uq_suggestion_employee_month"),
    )


class OwnerNote(Base):
    __tablename__ = "owner_notes"

    id:          Mapped[int]           = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int]           = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    note:        Mapped[str]           = mapped_column(Text,      nullable=False)
    month:       Mapped[Optional[str]] = mapped_column(String(7), nullable=True)
    year:        Mapped[Optional[int]] = mapped_column(nullable=True)
    created_at:  Mapped[DateTime]      = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at:  Mapped[DateTime]      = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    employee = relationship("Employee", back_populates="owner_notes")