from sqlalchemy import String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional
from app.database import Base


class Business(Base):
    __tablename__ = "businesses"

    id:                       Mapped[int]           = mapped_column(primary_key=True, index=True)
    user_id:                  Mapped[int]           = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name:            Mapped[str]           = mapped_column(String(300), nullable=False)
    business_type:            Mapped[str]           = mapped_column(String(100), nullable=False)
    employee_count_estimate:  Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    created_at:               Mapped[DateTime]      = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at:               Mapped[DateTime]      = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    owner          = relationship("User",          back_populates="business")
    employees      = relationship("Employee",      back_populates="business", cascade="all, delete-orphan")
    upload_history = relationship("UploadHistory", back_populates="business", cascade="all, delete-orphan")