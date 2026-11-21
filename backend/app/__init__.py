"""StoryVerse backend application package.

The package is organised by responsibility:

- ``core``    cross-cutting concerns (settings, logging, errors, middleware)
- ``api``     HTTP layer (versioned routers and endpoints)
- ``db``      database engine, session factory and connectivity helpers
- ``models``  SQLAlchemy ORM models (empty in Phase 1)
- ``schemas`` Pydantic models that define request/response payloads
- ``services`` reusable business logic that is independent of HTTP
"""

__all__ = ["__version__"]

__version__ = "0.1.0"
