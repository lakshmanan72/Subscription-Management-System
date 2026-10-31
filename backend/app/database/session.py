"""
Brightloop Database Session Management
Provides scoped session dependencies for FastAPI route handlers with graceful 503 handling.
"""

from typing import Generator
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.core.exceptions import DatabaseNotConfiguredException
from app.database.connection import get_engine, is_database_configured

_session_factory = None


def get_session_factory() -> sessionmaker:
    """Returns or lazily creates the session factory bound to the engine."""
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=get_engine(),
            expire_on_commit=False
        )
    return _session_factory


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding an active SQLAlchemy database session.
    
    If MySQL is not yet configured or reachable in this phase, it safely raises
    DatabaseNotConfiguredException, resulting in a clear HTTP 503 Service Unavailable
    response with instructions on connecting MySQL.
    """
    if not is_database_configured():
        raise DatabaseNotConfiguredException()

    try:
        session_factory = get_session_factory()
        session: Session = session_factory()
    except Exception as exc:
        raise DatabaseNotConfiguredException(
            message=f"Database connection error: Could not establish MySQL session ({str(exc)})."
        )

    try:
        yield session
        session.commit()
    except SQLAlchemyError as exc:
        session.rollback()
        raise DatabaseNotConfiguredException(
            message=f"Database execution error: {str(exc)}"
        )
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
