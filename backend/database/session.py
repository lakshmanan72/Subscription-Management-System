"""
Database connection, engine configuration, and session management.
Supports SQLite (with check_same_thread=False) and MySQL/PostgreSQL transparently.
"""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Locate database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brightloop.db")

# Ensure local sqlite path is inside backend directory when relative
if DATABASE_URL.startswith("sqlite:///./"):
    db_filename = DATABASE_URL.replace("sqlite:///./", "")
    backend_dir = Path(__file__).resolve().parent.parent
    db_path = backend_dir / db_filename
    DATABASE_URL = f"sqlite:///{db_path.as_posix()}"

engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 3600

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency for yielding database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables using metadata reflection/creation."""
    import backend.models  # noqa: F401 - ensure all models are imported
    Base.metadata.create_all(bind=engine)
