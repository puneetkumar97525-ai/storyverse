"""Typed application settings.

Every value is read from environment variables (or the ``backend/.env`` file).
Nothing secret is stored in the source code: ``POSTGRES_PASSWORD`` has no
default, so the application refuses to start until you provide one.

Usage::

    from app.core.config import get_settings

    settings = get_settings()
    settings.app_name
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import quote_plus

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# ``config.py`` lives in ``backend/app/core/``, so the backend root is 2 levels up.
BACKEND_DIR = Path(__file__).resolve().parents[2]

Environment = Literal["development", "test", "staging", "production"]

_VALID_LOG_LEVELS = {"CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"}


class Settings(BaseSettings):
    """Application settings validated at import/startup time."""

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application -----------------------------------------------------
    app_name: str = "StoryVerse API"
    app_version: str = "0.1.0"
    environment: Environment = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"

    # --- CORS ------------------------------------------------------------
    # Comma-separated so it is easy to edit in a .env file.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # --- PostgreSQL ------------------------------------------------------
    postgres_host: str = "localhost"
    postgres_port: int = Field(default=5432, ge=1, le=65535)
    postgres_user: str = "storyverse"
    postgres_password: str = Field(min_length=1)
    postgres_db: str = "storyverse"
    postgres_connect_timeout: int = Field(default=5, ge=1, le=60)

    # Optional full override, e.g. a managed database that hands you a DSN.
    # When set, it wins over the POSTGRES_* parts above.
    database_url: str | None = None

    # --- Validators ------------------------------------------------------
    @field_validator("environment", mode="before")
    @classmethod
    def _normalise_environment(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("log_level", mode="before")
    @classmethod
    def _normalise_log_level(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        level = value.strip().upper()
        if level not in _VALID_LOG_LEVELS:
            raise ValueError(f"LOG_LEVEL must be one of {sorted(_VALID_LOG_LEVELS)}")
        return level

    @field_validator("api_v1_prefix")
    @classmethod
    def _validate_prefix(cls, value: str) -> str:
        prefix = value.strip()
        if not prefix.startswith("/"):
            raise ValueError("API_V1_PREFIX must start with '/' (for example '/api/v1')")
        return prefix.rstrip("/")

    # --- Derived helpers -------------------------------------------------
    @property
    def cors_origins_list(self) -> list[str]:
        """CORS origins as a clean list of strings."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        """SQLAlchemy connection URL built from the individual settings.

        Credentials are URL-encoded so passwords containing ``@`` or ``:`` work.
        """
        if self.database_url:
            return self.database_url
        user = quote_plus(self.postgres_user)
        password = quote_plus(self.postgres_password)
        return (
            f"postgresql+psycopg://{user}:{password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def safe_database_url(self) -> str:
        """Connection URL with the password removed - safe to log."""
        url = self.sqlalchemy_database_url
        if "://" not in url or "@" not in url:
            return url
        scheme, _, remainder = url.partition("://")
        credentials, _, host = remainder.rpartition("@")
        user = credentials.split(":", 1)[0]
        return f"{scheme}://{user}:***@{host}"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_test(self) -> bool:
        return self.environment == "test"


@lru_cache
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance (one read of the environment)."""
    return Settings()  # type: ignore[call-arg]  # values come from env / .env
