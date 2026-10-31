"""
Brightloop Database Connection Manager
Configures the MySQL SQLAlchemy engine with connection pooling and lazy initialization.
Does not require a live MySQL server to import or inspect application schemas.
"""

import logging
from typing import Optional
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings

logger = logging.getLogger(__name__)

_engine: Optional[Engine] = None


def is_database_configured() -> bool:
    """
    Checks if DATABASE_URL contains real connection details or unconfigured placeholders.
    """
    url = settings.DATABASE_URL
    if not url:
        return False
    if "USER:PASSWORD" in url or "@HOST" in url:
        return False
    return True


def get_engine() -> Engine:
    """
    Returns the SQLAlchemy Engine instance with lazy initialization.
    Configured specifically for MySQL using PyMySQL.
    """
    global _engine
    if _engine is None:
        url = settings.DATABASE_URL
        # Ensure pymysql driver prefix if mysql is specified
        if url.startswith("mysql://"):
            url = url.replace("mysql://", "mysql+pymysql://", 1)

        connect_args = {}
        if "pymysql" in url:
            connect_args = {
                "connect_timeout": 5,
                "charset": "utf8mb4"
            }

        _engine = create_engine(
            url,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=True,
            connect_args=connect_args,
            echo=settings.DEBUG and settings.APP_ENV == "development"
        )
    return _engine


def check_database_connection() -> bool:
    """
    Actively attempts a lightweight 'SELECT 1' ping against the database.
    Returns True if reachable, False otherwise without raising unhandled errors.
    """
    if not is_database_configured():
        return False
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError as exc:
        logger.warning(f"Database connectivity check failed: {exc}")
        return False
    except Exception as exc:
        logger.warning(f"Unexpected error while pinging database: {exc}")
        return False
