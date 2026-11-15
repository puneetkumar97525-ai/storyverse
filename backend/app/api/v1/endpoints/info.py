"""Service metadata endpoint.

Lets the frontend discover which API build it is talking to, without hardcoding
version strings in the UI.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.config import Settings, get_settings
from app.schemas.health import ServiceInfoResponse

router = APIRouter(tags=["Service"])


@router.get(
    "/info",
    response_model=ServiceInfoResponse,
    summary="API metadata",
    description="Name, version, environment and documentation locations for this API.",
)
def service_info(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> ServiceInfoResponse:
    return ServiceInfoResponse(
        name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
        api_prefix=settings.api_v1_prefix,
        docs_url=request.app.docs_url or "/docs",
        openapi_url=request.app.openapi_url or "/openapi.json",
    )
