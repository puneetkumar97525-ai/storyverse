"""Health endpoint tests."""

from __future__ import annotations

from datetime import datetime

from fastapi.testclient import TestClient

from app.core.config import get_settings


def test_liveness_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == get_settings().app_name
    assert payload["version"] == get_settings().app_version
    assert payload["environment"] == "test"
    # Timestamp must be valid ISO 8601 / parsable.
    assert datetime.fromisoformat(payload["timestamp"]).tzinfo is not None


def test_liveness_does_not_require_database(client: TestClient, database_unavailable: None) -> None:
    """A database outage must never take down the liveness probe."""
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_responses_include_request_id_and_timing(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.headers["X-Request-ID"]
    assert float(response.headers["X-Process-Time-Ms"]) >= 0


def test_client_supplied_request_id_is_preserved(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"X-Request-ID": "abc-123"})

    assert response.headers["X-Request-ID"] == "abc-123"


def test_database_health_when_available(client: TestClient, database_available: None) -> None:
    response = client.get("/api/v1/health/db")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["database"] == "postgresql"
    assert payload["latency_ms"] == 1.5
    assert payload["detail"] is None


def test_database_health_returns_503_when_unavailable(
    client: TestClient, database_unavailable: None
) -> None:
    response = client.get("/api/v1/health/db")

    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "unavailable"
    assert payload["detail"] == "OperationalError"
    # The connection string (and its password) must never leak.
    assert "password" not in response.text.lower()


def test_readiness_is_ready_when_database_is_up(
    client: TestClient, database_available: None
) -> None:
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["checks"] == {"api": "ok", "database": "ok"}


def test_readiness_is_not_ready_when_database_is_down(
    client: TestClient, database_unavailable: None
) -> None:
    response = client.get("/api/v1/health/ready")

    assert response.status_code == 503
    payload = response.json()
    assert payload["status"] == "not_ready"
    assert payload["checks"]["database"] == "unavailable"
