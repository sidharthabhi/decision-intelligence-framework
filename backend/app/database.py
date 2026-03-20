from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


# Fix for Render/Railway URLs (postgres:// → postgresql://)
DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://")


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.models import (
        user,
        business,
        employee,
        performance,
        suggestion,
    )
    Base.metadata.create_all(bind=engine)
