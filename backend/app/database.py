from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings


engine       = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,   # auto-reconnect if DB drops
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Import all models so Base.metadata knows every table,
    then create any that don't exist yet.
    Called once at startup via lifespan in main.py.
    """
    from app.models import (        # noqa: F401  — side-effect imports
        user,
        business,
        employee,
        performance,
        suggestion,
    )
    Base.metadata.create_all(bind=engine)