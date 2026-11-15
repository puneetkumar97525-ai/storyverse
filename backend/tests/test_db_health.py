"""Unit tests for the database connectivity helper.

A throwaway SQLite database exercises the success path without needing
PostgreSQL; a closed local port exercises the failure path.
"""

from __future__ import annotations

from sqlalchemy import create_engine

from app.db.health import check_database_connection


def test_reports_available_when_query_succeeds() -> None:
    engine = create_engine("sqlite://")

    result = check_database_connection(engine)

    assert result.available is True
    assert result.detail is None
    assert result.latency_ms is not None
    assert result.latency_ms >= 0


def test_reports_unavailable_when_connection_fails() -> None:
    # Port 1 on localhost is never open, so the connection is refused instantly.
    engine = create_engine(
        "postgresql+psycopg://user:password@127.0.0.1:1/storyverse",
        connect_args={"connect_timeout": 1},
    )

    result = check_database_connection(engine)

    assert result.available is False
    assert result.latency_ms is None
    # Only the exception type is exposed - never the connection string.
    assert result.detail in {"OperationalError", "InterfaceError", "ProgrammingError"}
