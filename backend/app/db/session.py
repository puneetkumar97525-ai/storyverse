"""SQLAlchemy engine and session factory.

The engine is created once per process. Creating an engine does **not** open a
connection - the first real connection happens on the first query, so importing
this module never requires a running PostgreSQL server.
"""

from __future__ import annotations

import logging
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

engine = create_engine(
    settings.sqlalchemy_database_url,
    # Verify connections before use so a restarted database does not cause
    # "server closed the connection unexpectedly" errors in dev.
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    # Fail fast instead of hanging when the database host is unreachable.
    connect_args={"connect_timeout": settings.postgres_connect_timeout},
    echo=False,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a session and always closes it.

    Use it as ``db: Session = Depends(get_db)`` in routes that need the database.
    """
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def dispose_engine() -> None:
    """Close all pooled connections (called on application shutdown)."""
    engine.dispose()
    logger.debug("Database engine disposed")
