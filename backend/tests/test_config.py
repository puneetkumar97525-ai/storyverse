"""Settings tests: URL building, validation and secret handling."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings


def _settings(**overrides: object) -> Settings:
    """Build Settings from explicit values only (ignores the .env file)."""
    defaults: dict[str, object] = {
        "postgres_user": "storyverse",
        "postgres_password": "local-dev-password",
        "postgres_db": "storyverse",
        "postgres_host": "localhost",
        "postgres_port": 5432,
    }
    defaults.update(overrides)
    return Settings(_env_file=None, **defaults)  # type: ignore[arg-type]


def test_database_url_is_built_from_parts() -> None:
    settings = _settings(postgres_host="db", postgres_port=6543, postgres_db="storyverse_dev")

    assert settings.sqlalchemy_database_url == (
        "postgresql+psycopg://storyverse:local-dev-password@db:6543/storyverse_dev"
    )


def test_special_characters_in_password_are_url_encoded() -> None:
    settings = _settings(postgres_password="p@ss:word/1")

    assert "p%40ss%3Aword%2F1" in settings.sqlalchemy_database_url


def test_database_url_override_takes_precedence() -> None:
    settings = _settings(database_url="postgresql+psycopg://u:p@managed-host:5432/app")

    assert settings.sqlalchemy_database_url == "postgresql+psycopg://u:p@managed-host:5432/app"


def test_safe_database_url_hides_the_password() -> None:
    settings = _settings(postgres_password="super-secret")

    assert "super-secret" not in settings.safe_database_url
    assert ":***@" in settings.safe_database_url


def test_cors_origins_are_split_into_a_list() -> None:
    settings = _settings(cors_origins="http://localhost:5173, http://example.com ,")

    assert settings.cors_origins_list == ["http://localhost:5173", "http://example.com"]


def test_environment_is_case_insensitive() -> None:
    assert _settings(environment="PRODUCTION").environment == "production"


def test_unknown_environment_is_rejected() -> None:
    with pytest.raises(ValidationError):
        _settings(environment="not-a-real-environment")


def test_unknown_log_level_is_rejected() -> None:
    with pytest.raises(ValidationError):
        _settings(log_level="LOUD")


def test_api_prefix_must_start_with_a_slash() -> None:
    with pytest.raises(ValidationError):
        _settings(api_v1_prefix="api/v1")


def test_api_prefix_trailing_slash_is_removed() -> None:
    assert _settings(api_v1_prefix="/api/v2/").api_v1_prefix == "/api/v2"


def test_postgres_password_is_required(monkeypatch: pytest.MonkeyPatch) -> None:
    """No password may be hardcoded as a fallback."""
    monkeypatch.delenv("POSTGRES_PASSWORD", raising=False)

    with pytest.raises(ValidationError) as excinfo:
        Settings(_env_file=None)  # type: ignore[call-arg]

    assert "postgres_password" in str(excinfo.value)


def test_get_settings_is_cached() -> None:
    assert get_settings() is get_settings()
