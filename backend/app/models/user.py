from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id:               Mapped[int]  = mapped_column(primary_key=True, index=True)
    full_name:        Mapped[str]  = mapped_column(String(200), nullable=False)
    email:            Mapped[str]  = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password:  Mapped[str]  = mapped_column(String, nullable=False)
    is_active:        Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at:       Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    business = relationship(
        "Business",
        back_populates="owner",
        uselist=False,
        cascade="all, delete-orphan",
    )