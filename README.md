# StoryVerse

An interactive, AI-assisted storytelling platform for branching stories, voice narration,
multilingual content, creative studios and learning progress.

**Status: Phase 1 (project foundation) complete.** The repository currently contains a working
React + TypeScript frontend, a FastAPI backend, a PostgreSQL development setup, health checks,
tests and documentation. AI storytelling, authentication and the interactive features are
**not implemented yet** — see [Roadmap](#roadmap).

---

## Table of contents

- [What Phase 1 delivers](#what-phase-1-delivers)
- [What is deliberately not built yet](#what-is-deliberately-not-built-yet)
- [Tech stack](#tech-stack)
- [Quick start (manual, recommended)](#quick-start-manual-recommended)
- [Quick start (Docker Compose)](#quick-start-docker-compose)
- [Verify that the frontend and backend talk to each other](#verify-that-the-frontend-and-backend-talk-to-each-other)
- [Running the tests](#running-the-tests)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Configuration files explained](#configuration-files-explained)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)
- [License](#license)

---

## What Phase 1 delivers

| Area | Delivered |
| --- | --- |
| Frontend | React 19 + TypeScript (strict) + Vite, Tailwind CSS v4 design system, typed API client, live system-status panel |
| Backend | FastAPI app factory, versioned `/api/v1` routes, typed Pydantic responses, consistent JSON errors, request-id + timing middleware |
| Database | SQLAlchemy 2 engine + session factory, PostgreSQL 16 via Docker Compose, Alembic migrations wired to the same settings |
| Health checks | Liveness, database and readiness probes — used by Docker health checks and displayed in the UI |
| Config | Every setting from environment variables; `.env.example` files document them; `.env` is git-ignored; **no secret has a hardcoded default** |
| Tests | 30 Pytest tests (backend), 15 Vitest + Testing Library tests (frontend) |
| Tooling | Ruff (lint + format), ESLint + `tsc` (frontend), GitHub Actions CI, Dockerfiles, docker-compose |
| Docs | This README plus `docs/` guides for setup, architecture, structure and roadmap |

## What is deliberately not built yet

No AI generation, no accounts or auth, no story editor, no voice features, no quizzes or
achievements, no user library. The UI labels these as **planned** so nothing pretends to work.

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React 19 + TypeScript, Vite | Fast dev server, strict typing, tiny config |
| Styling | Tailwind CSS v4 | Utility classes, no separate CSS architecture to maintain at this stage |
| API | Python 3.11+ / FastAPI | Typed endpoints + free interactive docs at `/docs` |
| ORM | SQLAlchemy 2 + psycopg 3 | Mature, synchronous (simple to reason about for a first version) |
| Database | PostgreSQL 16 | JSON-friendly, strong constraints, easy to run in Docker |
| Migrations | Alembic | Versioned schema changes from day one |
| Tests | Pytest, Vitest, Testing Library | Standard tools for each side |

---

## Quick start (manual, recommended)

**Prerequisites:** Python 3.11+, Node.js 20.19+ (22 LTS recommended), and optionally Docker for
PostgreSQL. PostgreSQL is *not required* to start the app: the UI will simply report the database
as unavailable.

### 1. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env               # then edit POSTGRES_PASSWORD if you use a database
uvicorn app.main:app --reload --port 8000
```

- API root: <http://localhost:8000>
- Interactive docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/api/v1/health>

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
cp .env.example .env.local         # optional: defaults already work
npm run dev
```

Open <http://localhost:5173>.

### 3. Database (optional, terminal 3)

```bash
cp .env.example .env               # repository root: used by docker compose
# edit POSTGRES_PASSWORD, and use the same value in backend/.env
docker compose up -d db
```

Then restart the backend (or just refresh the UI) — the **Database** card flips to *Online* with a
latency in milliseconds.

> The Vite dev server proxies `/api/*` to `http://localhost:8000`, so the browser only ever calls
> same-origin URLs. No CORS problems, and no backend URL baked into the bundle.

## Quick start (Docker Compose)

Runs PostgreSQL, the API and the Vite dev server in one command:

```bash
cp .env.example .env
cp backend/.env.example backend/.env     # same POSTGRES_PASSWORD as above
docker compose up --build
```

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| API | <http://localhost:8000> |
| API docs | <http://localhost:8000/docs> |
| PostgreSQL | `localhost:5432` |

Useful commands: `docker compose logs -f backend`, `docker compose down`,
`docker compose down -v` (also deletes the database volume).

---

## Verify that the frontend and backend talk to each other

```bash
# 1. Backend liveness (no database needed)
curl http://localhost:8000/api/v1/health

# 2. Same endpoint through the Vite proxy - proves the browser's path works
curl http://localhost:5173/api/v1/health

# 3. Database probe: 200 when PostgreSQL is up, 503 when it is not
curl -i http://localhost:5173/api/v1/health/db

# 4. Readiness (aggregates the checks)
curl http://localhost:5173/api/v1/health/ready
```

The landing page also performs these calls live in the **Live system check** section: three cards
report the frontend, the API (with its version and environment) and PostgreSQL (with latency), and
a **Refresh** button re-runs every check. If the API is unreachable you get a visible error; if only
the database is down you get a specific hint instead of a silent failure.

---

## Running the tests

> Run each suite from its own folder (backend venv activated for the backend).

```bash
# Backend - 30 tests, no PostgreSQL required (database calls are stubbed)
cd backend
source .venv/bin/activate
ruff check . && ruff format --check .    # lint
pytest                                   # or: pytest --cov=app

# Frontend - 15 tests
cd frontend
npm run lint                             # ESLint
npm run typecheck                        # tsc (no emit)
npm test                                 # Vitest (one run)
npm run test:watch                       # Vitest (watch mode)
npm run build                            # production build
```

Last verified results (Python 3.11.2, Node 22.22.3):

```
backend  -> 30 passed in 0.44s          ruff: All checks passed! / 28 files formatted
frontend -> 15 passed (4 files)          tsc: OK   eslint: OK   vite build: OK
```

---

## API reference

Base path: `/api/v1` (configurable via `API_V1_PREFIX`).

| Method | Path | Purpose | Database? |
| --- | --- | --- | --- |
| `GET` | `/` | Friendly landing payload with docs/health URLs | No |
| `GET` | `/api/v1/info` | API name, version, environment, docs locations | No |
| `GET` | `/api/v1/health` | Liveness: is the process serving requests? | No |
| `GET` | `/api/v1/health/db` | Runs `SELECT 1`; **503** when PostgreSQL is unreachable | Yes |
| `GET` | `/api/v1/health/ready` | Readiness: API + database together; **503** until all pass | Yes |
| `GET` | `/docs` · `/redoc` · `/openapi.json` | Interactive docs / schema | No |

Errors always use one shape, so the frontend has a single error path:

```json
{ "error": { "code": "not_found", "message": "Not Found" } }
```

Validation failures add `details` with the offending field locations.

---

## Project structure

```
storyverse/
├── .github/workflows/ci.yml      CI: ruff+pytest, eslint+tsc+vitest+build
├── .env.example                  Docker Compose variables (copy to .env)
├── .gitignore                    Keeps dependencies, builds, caches and secrets out of Git
├── docker-compose.yml            Local stack: db + backend + frontend
├── README.md                     You are here
├── LICENSE                       MIT
│
├── backend/                      Python + FastAPI
│   ├── app/
│   │   ├── main.py               App factory: middleware, CORS, errors, routes, lifespan
│   │   ├── api/v1/               HTTP layer
│   │   │   ├── router.py         Combines endpoint modules under /api/v1
│   │   │   └── endpoints/        health.py (probes), info.py (metadata)
│   │   ├── core/                 config.py, errors.py, logging.py, middleware.py
│   │   ├── db/                   base.py (ORM base), session.py (engine), health.py (SELECT 1)
│   │   ├── models/               SQLAlchemy models (empty in Phase 1)
│   │   ├── schemas/              Pydantic request/response models
│   │   └── services/             Future business logic (empty in Phase 1)
│   ├── migrations/               Alembic environment + versions/
│   ├── tests/                    conftest.py + 30 Pytest tests
│   ├── alembic.ini               Alembic config (no credentials inside)
│   ├── pyproject.toml            Ruff + Pytest + coverage configuration
│   ├── requirements.txt          Runtime dependencies (pinned)
│   ├── requirements-dev.txt      Runtime + test/lint tools
│   ├── Dockerfile                Dev image (uvicorn --reload)
│   └── .env.example              Backend settings template
│
├── frontend/                     React + TypeScript + Vite
│   ├── src/
│   │   ├── main.tsx              Mounts <App/> into #root
│   │   ├── App.tsx               Shell: header / page / footer
│   │   ├── index.css             Tailwind v4 entry + design tokens
│   │   ├── pages/                HomePage.tsx (Phase 1 landing page)
│   │   ├── features/
│   │   │   ├── home/             Hero, Foundation, Roadmap, QuickStart sections
│   │   │   └── system/           Health API client, useSystemHealth hook, status panel
│   │   ├── components/layout/    AppHeader, AppFooter
│   │   ├── components/ui/        Badge, Card, StatusDot
│   │   ├── lib/api.ts            fetch wrapper: base URL, timeout, ApiError
│   │   ├── config/env.ts         Reads VITE_* variables in one place
│   │   ├── data/roadmap.ts       Copy for the roadmap & foundation sections
│   │   └── test/                 setup.ts (jest-dom) and mocks.ts (fake fetch)
│   ├── index.html                Vite HTML entry
│   ├── vite.config.ts            Plugins, alias, dev proxy, Vitest config
│   ├── tsconfig*.json            TypeScript project configs (app / node)
│   ├── eslint.config.js          Flat ESLint config
│   ├── package.json              Scripts + dependencies
│   ├── Dockerfile                Dev image (Vite dev server)
│   └── .env.example              Frontend variables template
│
└── docs/
    ├── getting-started.md        Detailed local setup + troubleshooting
    ├── architecture.md           How requests flow; where future features plug in
    ├── project-structure.md      Every folder and file, explained for beginners
    └── roadmap.md                Phase plan and definition of done
```

## Configuration files explained

| File | What it does |
| --- | --- |
| `.gitignore` | Tells Git what never to commit: `.venv/`, `node_modules/`, `dist/`, caches, coverage, `*.log`, and every `.env` file except the `.env.example` templates. |
| `.editorconfig` | Keeps indentation/newline style consistent across editors (4 spaces for Python, 2 for the frontend). |
| `.env.example` (root) | Template for Docker Compose: PostgreSQL user/password/database and the ports published on your machine. Copy it to `.env` and set your own password. |
| `backend/.env.example` | Template for the API: environment name, log level, CORS origins, `POSTGRES_*` connection parts, optional full `DATABASE_URL`. Read by `app/core/config.py`. |
| `frontend/.env.example` | Template for the UI: `VITE_API_BASE_URL` (shipped to the browser) and `VITE_DEV_PROXY_TARGET` (used only by the dev server). |
| `docker-compose.yml` | Defines the three local services, named volume for database data, health checks and start-up order. Fails fast if `POSTGRES_PASSWORD` is missing instead of shipping a default password. |
| `backend/pyproject.toml` | Ruff lint/format rules and Pytest settings (`pythonpath`, test paths, strict markers). Dependencies live in `requirements*.txt` for clarity. |
| `backend/alembic.ini` | Alembic's settings. It intentionally contains **no** database URL: `migrations/env.py` reads it from `app/core/config.py`, so credentials live in exactly one place. |
| `backend/requirements*.txt` | Pinned runtime and development dependencies, so every machine installs identical versions. |
| `frontend/vite.config.ts` | React + Tailwind plugins, `@/` alias, dev-server host/port, the `/api` proxy, and Vitest settings. |
| `frontend/tsconfig*.json` | TypeScript configuration: `tsconfig.app.json` for `src/`, `tsconfig.node.json` for the Vite config, joined by `tsconfig.json` project references. Strict mode is on. |
| `frontend/eslint.config.js` | Flat ESLint config: JavaScript/TypeScript recommended rules, React Hooks and React Refresh plugins. |
| `.github/workflows/ci.yml` | Runs lint, tests and a production build on every push to `main` and on every pull request. |

## Documentation

| Document | Contents |
| --- | --- |
| [docs/getting-started.md](docs/getting-started.md) | Prerequisites, step-by-step setup, database creation, migrations, troubleshooting |
| [docs/architecture.md](docs/architecture.md) | Request lifecycle, backend layering, frontend layering, health-check semantics, production notes |
| [docs/project-structure.md](docs/project-structure.md) | Folder-by-folder and file-by-file tour, written for beginners |
| [docs/roadmap.md](docs/roadmap.md) | Phase plan, out-of-scope items, definition of done |

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `ValidationError: postgres_password Field required` | Copy `backend/.env.example` → `backend/.env` (the password has no default by design). |
| UI shows **Backend API: Unavailable** | The API is not running, or it is not on port 8000. Check the backend terminal, then press **Refresh**. |
| UI shows **Database: Unavailable** and detail `OperationalError` | Start PostgreSQL (`docker compose up -d db`) and confirm `POSTGRES_*` in `backend/.env` match the root `.env`. |
| `Port 8000 is already in use` | Stop the other process or run `uvicorn ... --port 8001` and set `VITE_DEV_PROXY_TARGET=http://localhost:8001`. |
| `Blocked request. This host is not allowed` (Vite) | The dev server has `allowedHosts: true` for proxies/tunnels; if you manage your own host list, add yours there. |
| `npm install` peer-dependency error about TypeScript | This project pins TypeScript 5.9 because `typescript-eslint` does not support TypeScript 7 yet. Keep the pinned version. |

## Known limitations

- **Database only verified in this environment through a real PostgreSQL 16 instance** started
  outside Docker; the `docker-compose.yml` service itself has not been executed here (Docker is
  unavailable in the sandbox). It is validated as YAML only — run `docker compose up` once to
  confirm on your machine.
- **No CI run yet.** The workflow is committed but has not executed on GitHub.
- **No models or migrations.** `models/` and `migrations/versions/` are empty; the first migration
  arrives with the first table (Phase 2).
- **No routing on the frontend.** One page is enough for Phase 1; a router is postponed rather than
  adding an unused dependency.
- **Frontend is a dev-server setup**, not a production deployment: production would run
  `npm run build` and serve `dist/` behind a proxy/static host, with the API behind the same origin.
- **Backend images run as root and use `--reload`.** Fine for local development, not for production.
- **CORS defaults cover only localhost origins.** Deployed frontends must set `CORS_ORIGINS`.
- **Tests stub the database**, which is fast and CI-friendly but does not exercise SQL. Phase 2
  should add database-backed integration tests once tables exist.

## Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: structure, frontend, backend, PostgreSQL config, health checks, tests, docs | ✅ Complete |
| 2 | Story domain: models + migrations, branching story API, story reader UI, first AI-assisted generation | Not started |
| 3 | Voice interaction and narration, multilingual content | Not started |
| 4 | Drawing/creative studio, quizzes, achievements, progress tracking | Not started |
| 5 | Accounts, personal story library, sharing | Not started |

Details and definitions of done: [docs/roadmap.md](docs/roadmap.md).

## License

MIT — see [LICENSE](LICENSE).
