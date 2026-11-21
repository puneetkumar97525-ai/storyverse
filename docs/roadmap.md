# Roadmap

StoryVerse is built in phases so each layer is finished, tested and documented before the next
one starts. Only Phase 1 is implemented today.

## Phase 1 — Project foundation ✅ (complete)

**Goal:** a clean, running skeleton that a beginner can understand and extend.

| Deliverable | Where | Status |
| --- | --- | --- |
| Repository inspection before changes | this repository | ✅ |
| Professional folder structure | `backend/`, `frontend/`, `docs/`, root configs | ✅ |
| React + TypeScript + Vite frontend | `frontend/` | ✅ |
| Tailwind CSS design system | `frontend/src/index.css` | ✅ |
| FastAPI backend with versioned API | `backend/app/` | ✅ |
| PostgreSQL development configuration | `backend/app/db/`, docker-compose `db` | ✅ |
| Alembic migration tooling | `backend/migrations/`, `backend/alembic.ini` | ✅ |
| Root `.gitignore` | `.gitignore` | ✅ |
| `.env.example` files without secrets | root, `backend/`, `frontend/` | ✅ |
| Docker Compose for local development | `docker-compose.yml` | ✅ |
| Health checks (frontend + backend) | `/api/v1/health*`, status panel | ✅ |
| Initial tests | 30 Pytest + 15 Vitest | ✅ |
| Documentation | `README.md`, `docs/` | ✅ |
| CI pipeline | `.github/workflows/ci.yml` | ✅ (green on GitHub Actions) |

**Definition of done:** both servers start from a clean clone, the UI shows live API and database
status, all tests pass, lint is clean, and every configuration file is documented.

## Phase 2 — Story domain and first AI assistance

- SQLAlchemy models: `User` (minimal), `Story`, `StoryNode`, `Choice`, `Ending`; first Alembic
  migration.
- CRUD API for stories plus a `POST /api/v1/stories/{id}/play` session endpoint.
- Story reader UI: node text, choice buttons, ending screen, progress persistence.
- AI story generation behind a `services/ai_story_service.py` interface with the API key in the
  environment, a clear provider abstraction, and deterministic fakes for tests.
- Database-backed integration tests (PostgreSQL service in CI).

**Out of scope for Phase 2:** accounts with real authentication, voice, multilingual UI.

## Phase 3 — Voice and languages

- Text-to-speech narration with a queue and caching layer.
- Speech-to-text for choices, with graceful degradation when the browser cannot record.
- Locale-aware story content and UI strings, RTL support.

## Phase 4 — Creative studio and learning

- Drawing studio: canvas tools, artwork storage (object storage), gallery per story.
- Quizzes attached to stories, achievements, streaks and progress dashboards.

## Phase 5 — Accounts, library and sharing

- Sign-up/sign-in (password hashing, secure cookies), password reset.
- Personal story library, reading history, bookmarks.
- Sharing and public story pages, moderation basics.

## Explicitly not planned yet

- Payments or subscriptions.
- Social feeds, comments and moderation tooling.
- Mobile apps (the layout is responsive, but no native build exists).
- Offline/PWA support.

## Working agreements

- One phase at a time; no half-built features merged as "planned".
- Every new endpoint ships with tests and Pydantic schemas.
- No secrets in code, ever; new settings go into the relevant `.env.example`.
- Update `README.md` and the relevant `docs/` page in the same change that alters behaviour.
