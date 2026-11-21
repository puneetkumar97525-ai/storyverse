"""Health endpoints.

- ``GET /health``       liveness: the process is up (never touches the database)
- ``GET /health/db``    PostgreSQL connectivity
- ``GET /health/ready`` readiness: API + database, used by orchestrators

Liveness must stay dependency-free: if it queried the database, a database
outage would make the orchestrator restart perfectly healthy API containers.
"""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Response, status

from app.core.config import Settings, get_settings
from app.db.health import check_database_connection
from app.schemas.health import (
    DatabaseHealthResponse,
    HealthResponse,
    ReadinessResponse,
)

router = APIRouter(prefix="/health", tags=["Health"])


def _utcnow() -> datetime:
    return datetime.now(UTC)


@router.get(
    "",
    response_model=HealthResponse,
    summary="Liveness check",
    description="Returns 200 as soon as the API process can serve requests. No database access.",
)
def liveness(settings: Settings = Depends(get_settings)) -> HealthResponse:
    return HealthResponse(
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        timestamp=_utcnow(),
    )


@router.get(
    "/db",
    response_model=DatabaseHealthResponse,
    summary="Database check",
    description="Runs `SELECT 1` against PostgreSQL. Returns 503 when the database is unreachable.",
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": DatabaseHealthResponse,
            "description": "PostgreSQL is not reachable",
        }
    },
)
def database_health(response: Response) -> DatabaseHealthResponse:
    result = check_database_connection()
    if not result.available:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return DatabaseHealthResponse(
        status="ok" if result.available else "unavailable",
        latency_ms=result.latency_ms,
        detail=result.detail,
        timestamp=_utcnow(),
    )


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    summary="Readiness check",
    description="Aggregates every dependency. Returns 503 until all checks pass.",
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ReadinessResponse,
            "description": "At least one dependency is unavailable",
        }
    },
)
def readiness(response: Response) -> ReadinessResponse:
    database = check_database_connection()
    ready = database.available
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadinessResponse(
        status="ready" if ready else "not_ready",
        checks={"api": "ok", "database": "ok" if database.available else "unavailable"},
        timestamp=_utcnow(),
    )
