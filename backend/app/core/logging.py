"""Logging setup shared by the API server and tests."""

from __future__ import annotations

import logging
import sys

_LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def configure_logging(level: str = "INFO") -> None:
    """Configure root logging once, writing to stdout.

    Uvicorn installs its own handlers, so we only add a handler when none is
    configured yet. This keeps the output readable both locally and in Docker,
    and avoids duplicate log lines during tests.
    """
    root = logging.getLogger()
    root.setLevel(level.upper())

    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(fmt=_LOG_FORMAT, datefmt=_DATE_FORMAT))
        root.addHandler(handler)

    # Access logs are handled by uvicorn itself to avoid double logging.
    logging.getLogger("uvicorn.access").propagate = False
