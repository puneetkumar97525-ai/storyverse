"""Shared pytest fixtures.

The tests never require a running PostgreSQL server: any database call is
replaced with a stub, so the suite is fast and works in CI without Docker.
"""

from __future__ import annotations

import os
from collections.abc import Iterator

import pytest

# Must be set *before* the app modules read their settings.
# setdefault keeps real values when you intentionally export them yourself.
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("LOG_LEVEL", "WARNING")
os.environ.setdefault("POSTGRES_PASSWORD", "test-password")
os.environ.setdefault("POSTGRES_USER", "storyverse")
os.environ.setdefault("POSTGRES_DB", "storyverse_test")
os.environ.setdefault("POSTGRES_HOST", "localhost")

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.endpoints import health as health_endpoints
from app.db.health import DatabaseCheck
from app.main import create_app


@pytest.fixture(scope="session")
def app() -> FastAPI:
    """A single application instance for the whole test session."""
    return create_app()


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    """HTTP client; the context manager runs startup/shutdown events."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def database_available(monkeypatch: pytest.MonkeyPatch) -> None:
    """Pretend PostgreSQL answered ``SELECT 1`` in 1.5 ms."""
    monkeypatch.setattr(
        health_endpoints,
        "check_database_connection",
        lambda: DatabaseCheck(available=True, latency_ms=1.5),
    )


@pytest.fixture
def database_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    """Pretend PostgreSQL is down."""
    monkeypatch.setattr(
        health_endpoints,
        "check_database_connection",
        lambda: DatabaseCheck(available=False, detail="OperationalError"),
    )
