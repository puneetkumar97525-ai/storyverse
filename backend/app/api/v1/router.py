"""Combines every v1 endpoint module into a single router.

``main.py`` mounts this router under ``settings.api_v1_prefix`` (``/api/v1``),
so adding a feature later means: create ``endpoints/<feature>.py`` and include
its router here. No other file needs to change.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import health, info

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(info.router)

__all__ = ["api_router"]
