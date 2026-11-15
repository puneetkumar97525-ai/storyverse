"""FastAPI application factory.

Run locally with::

    uvicorn app.main:app --reload --port 8000

``create_app()`` is a factory so tests can build isolated app instances with
different settings. The module-level ``app`` object is what uvicorn imports.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import (
    PROCESS_TIME_HEADER,
    REQUEST_ID_HEADER,
    RequestContextMiddleware,
)
from app.db.health import check_database_connection
from app.schemas.health import RootResponse

logger = logging.getLogger(__name__)

DESCRIPTION = """
Backend API for StoryVerse - an interactive, AI-assisted storytelling platform.

Phase 1 (current): project foundation - configuration, health checks,
PostgreSQL wiring and documentation. Story, AI, voice and account features
arrive in later phases.
"""


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup/shutdown behaviour.

    A missing database is logged as a warning instead of aborting startup: the
    API stays up (so ``/health`` works and dashboards show the real problem)
    while ``/health/db`` reports 503.
    """
    settings = get_settings()
    logger.info(
        "%s v%s starting | environment=%s | database=%s",
        settings.app_name,
        settings.app_version,
        settings.environment,
        settings.safe_database_url,
    )

    if not settings.is_test:
        result = await run_in_threadpool(check_database_connection)
        if result.available:
            logger.info("PostgreSQL connection established (%.2f ms)", result.latency_ms or 0.0)
        else:
            logger.warning(
                "PostgreSQL is not reachable (%s). API started in degraded mode; "
                "start the database or check POSTGRES_* settings.",
                result.detail,
            )

    yield

    from app.db.session import dispose_engine

    dispose_engine()
    logger.info("%s stopped", settings.app_name)


def read_root(settings: Settings = Depends(get_settings)) -> RootResponse:
    """Landing payload so ``GET /`` is useful when exploring the API by hand."""
    return RootResponse(
        message="Welcome to the StoryVerse API.",
        name=settings.app_name,
        version=settings.app_version,
        api_prefix=settings.api_v1_prefix,
        docs_url="/docs",
        health_url=f"{settings.api_v1_prefix}/health",
    )


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()
    configure_logging(settings.log_level)

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=DESCRIPTION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
        debug=settings.debug,
    )

    # Request id/timing headers (inner) and CORS (outer).
    application.add_middleware(RequestContextMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[REQUEST_ID_HEADER, PROCESS_TIME_HEADER],
    )

    register_exception_handlers(application)

    application.add_api_route(
        "/",
        read_root,
        methods=["GET"],
        response_model=RootResponse,
        tags=["Service"],
        summary="API landing page",
    )
    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
