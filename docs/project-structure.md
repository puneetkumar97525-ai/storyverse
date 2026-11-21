# Project structure tour

A beginner-friendly explanation of every folder and important file. Reading this top to bottom is a
good way to understand how a full-stack project fits together.

## Top level

```
storyverse/
├── .github/          GitHub Actions workflows (automated checks)
├── backend/          Python + FastAPI server
├── frontend/         React + TypeScript browser app
├── docs/             Documentation (this folder)
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

| Path | Why it exists |
| --- | --- |
| `.gitignore` | Lists paths Git must ignore: virtual environments, `node_modules`, build output, caches, coverage reports and all `.env` files. Without it, secrets and 200 MB of dependencies would land in commits. |
| `.env.example` | Template for the root `.env` read by Docker Compose. Committed because it contains no secrets; `.env` is not. |
| `docker-compose.yml` | Describes the local stack as code: a PostgreSQL container, the API container and the Vite container, with health checks and a persistent volume. |
| `.editorconfig` | Editor-agnostic indentation and newline rules (4 spaces for Python, 2 for the frontend). |
| `README.md` | Entry point: what the project is, how to run it, what works and what does not. |
| `LICENSE` | MIT licence text. |

## `backend/` — the Python API

```
backend/
├── app/
│   ├── main.py
│   ├── api/v1/{router.py, endpoints/}
│   ├── core/{config.py, errors.py, logging.py, middleware.py}
│   ├── db/{base.py, session.py, health.py}
│   ├── models/
│   ├── schemas/
│   └── services/
├── migrations/{env.py, script.py.mako, versions/}
├── tests/
├── alembic.ini
├── pyproject.toml
├── requirements.txt
├── requirements-dev.txt
├── .env.example
├── .dockerignore
└── Dockerfile
```

### `app/`

| File / folder | What it does |
| --- | --- |
| `app/main.py` | The **application factory**. `create_app()` registers middleware, CORS, error handlers and routers, and defines `lifespan` (runs on startup/shutdown: logs the configuration, warns if PostgreSQL is down, disposes the engine on exit). `app = create_app()` is what uvicorn imports. |
| `app/api/v1/router.py` | Collects every `/api/v1` route into one `api_router`. Adding a feature means adding one `include_router` line here. |
| `app/api/v1/endpoints/health.py` | The three probes: liveness (no database), database (`SELECT 1`), readiness (both). |
| `app/api/v1/endpoints/info.py` | `GET /api/v1/info` — name, version, environment and where the docs live. |
| `app/core/config.py` | `Settings` (Pydantic) mapping environment variables to typed fields, plus derived values such as the assembled database URL and a password-masked version for logs. Cached by `get_settings()`. |
| `app/core/errors.py` | Converts every exception (HTTP, validation, unexpected) into one JSON error envelope. |
| `app/core/logging.py` | One log format for the whole app; avoids duplicate handlers under uvicorn and pytest. |
| `app/core/middleware.py` | Adds `X-Request-ID` (generated or propagated) and `X-Process-Time-Ms` to each response, for tracing and performance. |
| `app/db/base.py` | `Base` — the class future models inherit from — plus naming conventions so constraints have predictable names in migrations. |
| `app/db/session.py` | Creates the SQLAlchemy engine and session factory, exposes the `get_db()` FastAPI dependency, and `dispose_engine()` for shutdown. |
| `app/db/health.py` | `check_database_connection()`: runs `SELECT 1`, measures latency, and returns a result object instead of raising. |
| `app/models/` | SQLAlchemy ORM models. Empty in Phase 1 — no tables are defined yet. |
| `app/schemas/` | Pydantic models that define API input/output (`health.py` today). |
| `app/services/` | Business logic that must be testable without HTTP. Empty in Phase 1. |

### Supporting files

| File | What it does |
| --- | --- |
| `alembic.ini` | Alembic settings: where migrations live, logging, and *no* database URL (it comes from the app settings). |
| `migrations/env.py` | Alembic's entry point: builds the engine from `app.core.config`, exposes `Base.metadata` for autogeneration, supports offline SQL mode. |
| `migrations/versions/` | One file per schema revision. Empty until Phase 2. |
| `tests/conftest.py` | Sets test-only environment variables **before** importing the app, then provides fixtures: `client` (TestClient), `database_available`, `database_unavailable`. |
| `tests/test_health.py` | Liveness, database and readiness behaviour, including the "database down" paths and the request-id header. |
| `tests/test_info.py` | Landing endpoint, `/info`, OpenAPI schema and Swagger page. |
| `tests/test_errors.py` | 404 shape, validation details, generic 500 without leaking internals, CORS preflight. |
| `tests/test_config.py` | Settings validation: URL assembly, URL-encoding of special characters, override precedence, password masking, required password, rejected values. |
| `tests/test_db_health.py` | The probe itself against an in-memory SQLite engine (success) and a closed port (failure). |
| `pyproject.toml` | Ruff and Pytest configuration (line length, selected lint rules, test paths, `pythonpath`). |
| `requirements.txt` / `requirements-dev.txt` | Pinned dependencies; the dev file includes the runtime file and adds Pytest, coverage, Ruff. |
| `Dockerfile` | Development image: installs dependencies then starts `uvicorn --reload`. |
| `.dockerignore` | Keeps `.venv`, caches, `.env` and local databases out of the image build context. |
| `.env.example` | Every backend setting with safe placeholder values. |

## `frontend/` — the React app

```
frontend/
├── src/
│   ├── main.tsx, App.tsx, index.css, vite-env.d.ts
│   ├── components/{layout,ui}/
│   ├── config/env.ts
│   ├── data/roadmap.ts
│   ├── features/{home,system}/
│   ├── lib/api.ts
│   ├── pages/HomePage.tsx
│   └── test/{setup.ts, mocks.ts}
├── index.html
├── vite.config.ts
├── tsconfig.json, tsconfig.app.json, tsconfig.node.json
├── eslint.config.js
├── package.json, package-lock.json
├── .env.example
├── .dockerignore
└── Dockerfile
```

### Source files

| File / folder | What it does |
| --- | --- |
| `index.html` | The single HTML page Vite serves. Contains `<div id="root">` and loads `src/main.tsx`. |
| `src/main.tsx` | Creates the React root and renders `<App/>` inside `<StrictMode>` (extra development warnings). Also imports the global stylesheet. |
| `src/App.tsx` | The layout shell: header, page area, footer. A router would be introduced here. |
| `src/index.css` | Tailwind CSS v4 entry point: `@import 'tailwindcss'`, design tokens via `@theme`, and base styles for `body`. No `tailwind.config.js` is needed in v4. |
| `src/pages/HomePage.tsx` | The Phase 1 landing page: composes the hero, live status panel, foundation list, roadmap and quick-start sections. |
| `src/features/home/*` | Presentational sections (`Hero`, `FoundationSection`, `RoadmapSection`, `QuickStartSection`). They contain no data fetching. |
| `src/features/system/api.ts` | The only code that knows the health endpoints. `fetchDatabaseHealth` treats HTTP 503 as a valid answer. |
| `src/features/system/useSystemHealth.ts` | Custom hook: runs the checks on mount, polls every 30 s, exposes `refresh()`, cancels requests on unmount, and maps results to `online / offline / checking / unknown`. |
| `src/features/system/SystemStatusPanel.tsx` | Renders the three status cards, the last-checked time, a refresh button and contextual hints. |
| `src/features/system/types.ts` | TypeScript mirrors of the backend schemas — keep them in sync with `app/schemas/health.py`. |
| `src/lib/api.ts` | `getJson<T>()`: builds the URL from `env.apiBaseUrl`, adds a timeout, parses JSON and throws a typed `ApiError`. |
| `src/config/env.ts` | Reads and normalises `VITE_API_BASE_URL` (default `/api/v1`). Components never read `import.meta.env` directly. |
| `src/components/layout/*` | `AppHeader` (brand + phase badge) and `AppFooter` (stack + licence). |
| `src/components/ui/*` | Reusable primitives: `Badge`, `Card`, `StatusDot`. No API knowledge. |
| `src/data/roadmap.ts` | All roadmap/foundation copy in one place, so page components stay about layout. |
| `src/test/setup.ts` | Loads jest-dom matchers and resets the DOM/global stubs after each test. |
| `src/test/mocks.ts` | Realistic API payloads and `mockFetch()` (returns queued responses or throws). |
| `src/**/__tests__/*.test.ts(x)` | Unit tests for the fetch wrapper, the feature API and the status panel, plus an `App` smoke test. |

### Configuration files

| File | What it does |
| --- | --- |
| `package.json` | Scripts (`dev`, `build`, `test`, `lint`, `typecheck`) and pinned dependencies. |
| `package-lock.json` | Exact dependency tree — commit it so installs are reproducible (`npm ci`). |
| `vite.config.ts` | React + Tailwind plugins, `@/` alias, dev-server host/port and the `/api` proxy, preview server, and the Vitest configuration. |
| `tsconfig.json` | A "solution" file: references the two configs below so `tsc -b` checks both. |
| `tsconfig.app.json` | Browser code in `src/`: strict mode, `react-jsx`, bundler resolution, `@/*` path alias. |
| `tsconfig.node.json` | Node-side code (`vite.config.ts`), which may use `process` and Node types. |
| `eslint.config.js` | Flat ESLint config with the JS/TS recommended rules plus React Hooks and React Refresh. |
| `vite-env.d.ts` | Declares the `VITE_*` variables so TypeScript knows them. |
| `.env.example` | Documents the two `VITE_*` variables; copy to `.env.local`. |
| `Dockerfile` / `.dockerignore` | Development image running the Vite server with `npm ci` dependencies. |

## `docs/`

| File | Purpose |
| --- | --- |
| `getting-started.md` | Install, configure, run, test, migrate, troubleshoot. |
| `architecture.md` | How a request flows, layer responsibilities, health-check reasoning, where future features go. |
| `project-structure.md` | This tour. |
| `roadmap.md` | Phase plan and definition of done. |

## Reading order for a newcomer

1. `README.md` — the big picture and the quick start.
2. This file — what lives where.
3. `backend/app/main.py` — how the API is assembled.
4. `backend/app/api/v1/endpoints/health.py` and `app/db/health.py` — one feature end to end.
5. `frontend/src/features/system/` — the same feature from the browser side.
6. `docs/architecture.md` — the reasoning behind all of it.
