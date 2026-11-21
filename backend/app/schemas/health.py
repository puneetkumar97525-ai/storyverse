"""Health and service-metadata response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Basic liveness/staleness-free health payload (no database access)."""

    status: Literal["ok"] = "ok"
    service: str = Field(description="Human readable service name")
    version: str = Field(description="Deployed API version")
    environment: str = Field(description="development | test | staging | production")
    timestamp: datetime = Field(description="Server time in UTC (ISO 8601)")


class DatabaseHealthResponse(BaseModel):
    """Result of the PostgreSQL connectivity probe."""

    status: Literal["ok", "unavailable"]
    database: Literal["postgresql"] = "postgresql"
    latency_ms: float | None = Field(default=None, description="Round-trip time of SELECT 1")
    detail: str | None = Field(
        default=None,
        description="Short, non-sensitive reason when the database is unavailable",
    )
    timestamp: datetime


class ReadinessResponse(BaseModel):
    """Aggregated readiness: is the API able to serve database-backed traffic?"""

    status: Literal["ready", "not_ready"]
    checks: dict[str, str] = Field(description="Individual check name -> status")
    timestamp: datetime


class ServiceInfoResponse(BaseModel):
    """Static metadata about this API build."""

    name: str
    version: str
    environment: str
    api_prefix: str
    docs_url: str
    openapi_url: str


class RootResponse(BaseModel):
    """Friendly landing payload for ``GET /``."""

    message: str
    name: str
    version: str
    api_prefix: str
    docs_url: str
    health_url: str
