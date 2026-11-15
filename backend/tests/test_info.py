"""Tests for the service metadata endpoints and the OpenAPI schema."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_root_returns_landing_payload(client: TestClient) -> None:
    response = client.get("/")

    assert response.status_code == 200
    payload = response.json()
    assert "StoryVerse" in payload["message"]
    assert payload["docs_url"] == "/docs"
    assert payload["health_url"].endswith("/health")
    assert payload["api_prefix"] == "/api/v1"


def test_service_info_describes_the_api(client: TestClient) -> None:
    response = client.get("/api/v1/info")

    assert response.status_code == 200
    payload = response.json()
    assert payload["api_prefix"] == "/api/v1"
    assert payload["openapi_url"] == "/openapi.json"
    assert payload["environment"] == "test"


def test_openapi_schema_lists_health_routes(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/health" in paths
    assert "/api/v1/health/db" in paths
    assert "/api/v1/health/ready" in paths


def test_swagger_docs_page_is_served(client: TestClient) -> None:
    response = client.get("/docs")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
