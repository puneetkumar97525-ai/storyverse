"""Database connectivity check used by the health endpoints.

Kept separate from the HTTP layer so it can be unit-tested or reused by
background jobs and container health checks.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from time import perf_counter

from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class DatabaseCheck:
    """Result of a database connectivity check."""

    available: bool
    latency_ms: float | None = None
    detail: str | None = None


def check_database_connection(engine: Engine | None = None) -> DatabaseCheck:
    """Run ``SELECT 1`` against PostgreSQL.

    Returns a :class:`DatabaseCheck` instead of raising: a missing database is a
    degraded state reported to the caller (HTTP 503), not a crash. Errors are
    summarised by type only, so credentials never end up in logs or responses.
    """
    if engine is None:
        # Imported lazily so this module stays importable without configuration.
        from app.db.session import engine as default_engine

        engine = default_engine

    started = perf_counter()
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        logger.warning("Database health check failed: %s", type(exc).__name__)
        return DatabaseCheck(available=False, detail=type(exc).__name__)

    latency_ms = round((perf_counter() - started) * 1000, 2)
    return DatabaseCheck(available=True, latency_ms=latency_ms)
