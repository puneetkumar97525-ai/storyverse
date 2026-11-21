# Architecture

Phase 1 is a thin but complete vertical slice: a browser calls the React app, which calls the
FastAPI backend, which can talk to PostgreSQL. Everything else is scaffolding built around that
slice so Phase 2 can add features without restructuring.

## Request lifecycle

```
Browser (http://localhost:5173)
   │  GET /api/v1/health          (relative URL – same origin)
   ▼
Vite dev server  ── proxy ──►  FastAPI (http://localhost:8000)
                                   │
                                   ├─ middleware: X-Request-ID + X-Process-Time-Ms
                                   ├─ CORS: allowed origins from CORS_ORIGINS
                                   ├─ router: /api/v1/... → endpoint function
                                   ├─ Pydantic: validate request, serialise response
                                   └─ SQLAlchemy engine → PostgreSQL:5432 (SELECT 1)
```

Why the proxy? The browser only ever calls its own origin, so development needs no CORS dance and
the production bundle contains no hardcoded API hostname. In production an nginx (or similar)
reverse proxy plays the same role as the Vite proxy.

## Backend layering

| Layer | Location | Responsibility |
| --- | --- | --- |
| Application | `app/main.py` | `create_app()` builds the app: middleware, CORS, error handlers, routers, lifespan (startup/shutdown). Tests import this factory, so no global state leaks between tests. |
| HTTP | `app/api/v1/` | Routers and endpoint functions only. `router.py` is the single place that mounts endpoint modules. |
| Schemas | `app/schemas/` | Pydantic models describing exactly what goes in and out. They drive `/openapi.json`, so the docs are always accurate. |
| Cross-cutting | `app/core/` | `config.py` (settings), `logging.py`, `errors.py` (JSON error envelope), `middleware.py` (request id/timing). |
| Data | `app/db/` | `base.py` (declarative `Base` + naming conventions), `session.py` (engine + `get_db()` dependency), `health.py` (`SELECT 1` probe). |
| Domain (future) | `app/models/`, `app/services/` | ORM models and business logic that must not live in HTTP handlers. Empty by design in Phase 1. |
| Migrations | `migrations/` | Alembic environment reading the same settings as the app. |

**Rule of thumb for Phase 2+:** endpoints validate and delegate; `services/` holds the logic; models
hold persistence. Nothing imports FastAPI inside `services/` so it can be unit-tested directly.

## Frontend layering

| Layer | Location | Responsibility |
| --- | --- | --- |
| Entry | `src/main.tsx` | Mounts `<App/>`; the only file that touches `createRoot`. |
| Shell | `src/App.tsx` | Header / main / footer layout. Routing would be added here. |
| Pages | `src/pages/` | Compose feature sections into a screen. |
| Features | `src/features/*` | Self-contained slices. `system/` owns the health API calls, the `useSystemHealth` hook and the status panel; `home/` owns the marketing sections. |
| Shared UI | `src/components/ui` | Presentational primitives (Badge, Card, StatusDot) with no knowledge of the API. |
| Infrastructure | `src/lib/api.ts`, `src/config/env.ts` | One fetch wrapper (base URL, timeout, uniform `ApiError`) and one place that reads `VITE_*` variables. |
| Tests | `src/**/__tests__`, `src/test/` | Vitest + Testing Library. `test/mocks.ts` stubs `fetch` with realistic API payloads. |

**Rule of thumb for Phase 2+:** components never call `fetch` directly. Add a function to a
feature's `api.ts`, wrap it in a hook, and render the hook's state. That keeps loading/error logic
in one place per feature.

## Health checks: three probes, three questions

| Endpoint | Question | Uses database | Typical consumer |
| --- | --- | --- | --- |
| `/api/v1/health` | Is the process alive and serving? | No | Load balancer liveness probe, uptime monitors |
| `/api/v1/health/db` | Can we execute `SELECT 1`? | Yes | Dashboards, debugging |
| `/api/v1/health/ready` | Is everything this API needs ready? | Yes | Orchestrator readiness gate, before traffic |

Design decisions:

- **Liveness must not touch the database.** A database outage should not make an orchestrator
  restart healthy containers, which would cause a crash loop.
- **A missing database does not stop startup.** The API logs a warning and serves in degraded mode,
  so `503` responses explain the real problem instead of "connection refused on port 8000".
- **Failures return 503 with a typed body**, not an unhandled exception; the frontend reads
  `status: "unavailable"` plus a non-sensitive `detail` (exception *type*, never the DSN).
- **The frontend surfaces both states separately** — API down and database down are different
  messages, because they need different fixes.

## Error handling

Every failure passes through `app/core/errors.py` and returns:

```json
{ "error": { "code": "not_found", "message": "Not Found", "details": [...] } }
```

- `StarletteHTTPException` → its status code with a short machine-readable `code`.
- `RequestValidationError` → `422` with `details[]` listing `location`, `message`, `type`.
- Any other exception → `500` with a generic message; the stack trace goes to logs only, so SQL,
  secrets and internals never reach clients.

The frontend `getJson()` parses that envelope into `ApiError` (with `status` and `payload`), which is
why the status panel can treat "database down (503)" as information rather than an error.

## Configuration

All configuration is injected through environment variables and validated by Pydantic
(`app/core/config.py`):

- `.env` files are git-ignored; `.env.example` files are committed templates.
- `POSTGRES_PASSWORD` has **no default**, so the app cannot start with a hidden credential.
- `DATABASE_URL` can override the individual `POSTGRES_*` parts (useful for managed databases).
- `safe_database_url` masks the password for logging.
- The frontend reads only `VITE_API_BASE_URL` (public by definition); the proxy target is read by
  the dev server on the Node side and never ships to the browser.

## Where future features plug in

| Feature (later phase) | Backend | Frontend |
| --- | --- | --- |
| Story model + branching | `models/story.py`, `schemas/story.py`, `api/v1/endpoints/stories.py`, first Alembic migration | `features/stories/` + router |
| AI-assisted generation | `services/ai_story_service.py` behind an interface, API key from env, never in code | Streaming UI in `features/stories/` |
| Voice narration | Endpoints returning audio URLs; provider SDK in `services/` | `features/voice/` with the Web Audio / Speech APIs |
| Multilingual | Locale column on story models, translation service | i18n layer (e.g. `react-i18next`) |
| Drawing studio | Object storage for artwork, metadata in PostgreSQL | Canvas-based `features/studio/` |
| Quizzes, achievements, progress | `models/quiz.py`, `models/achievement.py`, service layer with rules | `features/learning/` |
| Accounts + library | Auth endpoints, password hashing, sessions/JWT in cookies | Auth context + protected routes in `App.tsx` |

No Phase-1 file needs to be rewritten for these; each adds a router, a slice and (from Phase 2 on)
a migration.

## Production considerations (not implemented yet)

- Serve the built frontend (`npm run build` → `dist/`) from a static host or CDN behind the same
  origin as the API, so the relative `/api/v1` base URL keeps working.
- Run the API with multiple uvicorn workers (or Gunicorn `UvicornWorker`) **without** `--reload`.
- Use a non-root user in the backend image and pin image digests.
- Move secrets to a secret manager; never bake `.env` into images.
- Set `ENVIRONMENT=production`, restrict `CORS_ORIGINS` to real domains, and disable `DEBUG`.
- Add structured logs/metrics (the request-id middleware is the hook for this) and database
  connection-pool tuning.
