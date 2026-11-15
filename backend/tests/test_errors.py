"""Error handling: every failure must use the same JSON envelope."""

from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.testclient import TestClient

from app.core.errors import register_exception_handlers


def test_unknown_route_returns_standard_error(client: TestClient) -> None:
    response = client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    error = response.json()["error"]
    assert error["code"] == "not_found"
    assert isinstance(error["message"], str)


def test_validation_error_lists_invalid_fields() -> None:
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/items")
    def list_items(limit: int = Query(default=10, ge=1, le=100)) -> dict[str, int]:
        return {"limit": limit}

    with TestClient(app) as test_client:
        response = test_client.get("/items", params={"limit": 500})

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert error["details"][0]["location"] == ["query", "limit"]


def test_unexpected_exception_returns_generic_500() -> None:
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/boom")
    def boom() -> None:
        raise RuntimeError("secret internal detail")

    # raise_server_exceptions=False mirrors production: Starlette hands the
    # exception to our handler instead of re-raising it in the test client.
    with TestClient(app, raise_server_exceptions=False) as test_client:
        response = test_client.get("/boom")

    assert response.status_code == 500
    error = response.json()["error"]
    assert error["code"] == "internal_server_error"
    # Internal details must not leak to clients.
    assert "secret internal detail" not in response.text


def test_cors_preflight_allows_the_vite_dev_origin(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
