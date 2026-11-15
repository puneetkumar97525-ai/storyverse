# Getting started

This guide takes you from a fresh clone to a running application, then shows how to run the tests
and fix the most common problems. Every command is meant to be copy-pasted.

## 1. Prerequisites

| Tool | Version | Check with | Needed for |
| --- | --- | --- | --- |
| Python | 3.11+ | `python --version` | Backend |
| Node.js + npm | 20.19+ (22 LTS recommended) | `node --version` | Frontend |
| Docker + Compose | any recent version | `docker compose version` | PostgreSQL (optional) |
| Git | any | `git --version` | Cloning |

You can finish Phase 1 without Docker: everything except the database runs from Python and Node.

## 2. Clone and create your local configuration

```bash
git clone https://github.com/puneetkumar97525-ai/storyverse.git
cd storyverse
```

Configuration is environment-based. Copy the templates — the copies are git-ignored:

```bash
cp .env.example .env                  # Docker Compose (root)
cp backend/.env.example backend/.env  # API settings
cp frontend/.env.example frontend/.env.local
```

Then set a password you choose (never reuse a real one):

```bash
# edit .env and backend/.env so POSTGRES_PASSWORD matches in both files
```

> `POSTGRES_PASSWORD` has **no default in the code**. If it is missing, the backend refuses to
> start with a clear validation error. That is intentional: no secret should live in source.

## 3. Start the database (optional)

```bash
docker compose up -d db
docker compose ps          # wait for "healthy"
```

This starts PostgreSQL 16 with the credentials from the root `.env` and stores data in the named
volume `storyverse_postgres_data`.

If you prefer a locally installed PostgreSQL, create a database and user manually and point
`backend/.env` at it:

```sql
CREATE ROLE storyverse LOGIN PASSWORD 'your-local-password';
CREATE DATABASE storyverse OWNER storyverse;
```

## 4. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

You should see a startup line such as:

```
StoryVerse API v0.1.0 starting | environment=development | database=postgresql+psycopg://storyverse:***@localhost:5432/storyverse
PostgreSQL connection established (9.51 ms)
```

The password is always masked in logs. If the database is down you get a **warning** instead of a
crash, and the API keeps serving with `503` on the database endpoints:

```
PostgreSQL is not reachable (OperationalError). API started in degraded mode; ...
```

Check it works:

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/health/db
```

Interactive documentation: <http://localhost:8000/docs>.

## 5. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The **Live system check** section calls the real health endpoints
through the Vite proxy and shows frontend/API/database status. Press **Refresh** after starting or
stopping services to see the change.

## 6. Run the tests

Backend (from `backend/`, venv activated):

```bash
pytest                                   # 30 tests
pytest --cov=app --cov-report=term-missing
ruff check .                             # lint
ruff format --check .                    # formatting
```

Frontend (from `frontend/`):

```bash
npm test                                 # Vitest, 15 tests
npm run test:watch                       # watch mode while developing
npm run lint                             # ESLint
npm run typecheck                        # tsc
npm run build                            # production build into dist/
```

The backend suite never touches a real database — `tests/conftest.py` stubs every database call — so
it runs anywhere, including CI, in under a second.

## 7. Database migrations (Alembic)

Phase 1 defines no tables, so there are no migrations yet. The tooling is already wired:

```bash
cd backend
alembic current                          # show the revision the database is on
alembic check                            # "No new upgrade operations detected."
```

When the first model is added in Phase 2:

```bash
alembic revision --autogenerate -m "create users table"
alembic upgrade head                     # apply
alembic downgrade -1                     # roll back one revision
```

`migrations/env.py` reads the URL from `app/core/config.py`, so you never store credentials in
`alembic.ini`.

## 8. Everything with Docker Compose

```bash
cp .env.example .env
cp backend/.env.example backend/.env     # same POSTGRES_PASSWORD
docker compose up --build
```

| Service | URL | Notes |
| --- | --- | --- |
| `frontend` | <http://localhost:5173> | Vite dev server, proxies `/api` to `backend:8000` |
| `backend` | <http://localhost:8000> | `uvicorn --reload`, source bind-mounted |
| `db` | `localhost:5432` | PostgreSQL 16, data in a named volume |

```bash
docker compose logs -f backend     # follow API logs
docker compose exec backend pytest # run the backend tests inside the container
docker compose down                # stop (data kept)
docker compose down -v             # stop and delete the database volume
```

## Troubleshooting

### `postgres_password: Field required`

`backend/.env` is missing or does not define `POSTGRES_PASSWORD`. Copy `backend/.env.example`
to `backend/.env`.

### The UI says “Backend API: Unavailable”

The API is not reachable at the proxy target. Check that `uvicorn` is running on port 8000, then
press **Refresh**. If you moved the backend to another port, set `VITE_DEV_PROXY_TARGET` in
`frontend/.env.local` (for example `http://localhost:8001`) and restart `npm run dev`.

### The UI says “Database: Unavailable” with detail `OperationalError`

PostgreSQL is not running, or the credentials do not match.

- `docker compose ps` — is `storyverse-db` healthy?
- `backend/.env` `POSTGRES_*` values must match the root `.env` used by Compose.
- Host must be `localhost` when the backend runs on your machine, `db` inside Compose.

### `Address already in use`

Something already uses the port. Either stop it, or start on another port
(`uvicorn app.main:app --port 8001`, then update `VITE_DEV_PROXY_TARGET`).

### Vite: “Blocked request. This host is not allowed.”

The dev server accepts proxy/tunnel hostnames because `server.allowedHosts` is `true` in
`vite.config.ts`. If you lock that down, add your hostname explicitly.

### `npm install` fails on peer dependencies (TypeScript)

`typescript-eslint` supports TypeScript `<6.1`, so the project pins TypeScript 5.9. Do not force a
newer TypeScript; check `frontend/package.json` matches the lockfile before opening a PR.

### `pip install psycopg[binary]` compiles from source

You are on a platform without a prebuilt wheel. Install PostgreSQL headers (`libpq-dev` on
Debian/Ubuntu, `postgresql` via Homebrew on macOS) or use Docker instead.
