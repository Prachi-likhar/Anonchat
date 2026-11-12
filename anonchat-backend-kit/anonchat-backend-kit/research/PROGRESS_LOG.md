# Progress Log
Newest entry at the top. Every prompt gets a PLANNED entry before coding and DONE lines as work completes.

## PLANNED — 2026-11-12 — Phase 0 & Phase 1 (Scaffold + Foundation) & Push to Git
- **Prompt (my words):** Start the backend implementation with Phase 0 and Phase 1 of `docs/BUILD_PLAN.md` (per user clarification after checking `docs/ADMIN.md` dependencies): initialize the CommonJS Node/Express project in `anonchat-backend-kit/anonchat-backend-kit/`, set up config, DB pool, SQL migration runner with `001_init.sql`, `/api/health` endpoint, `AppError`, `asyncHandler`, `validate` middleware, `errorHandler`, `notFound`, `pino` logger with redaction, global rate limiter, linting/formatting, and tests; then run `error-review` and commit + push directly to `origin/main`.
- **Already done:**
  - Kit documentation (`AGENTS.md`, `README.md`, `docs/*.md`), SQL schema (`db/schema.sql`, `db/001_init.sql`), Google Apps Script (`apps-script/Code.gs`), and `.agent/` rules/skills/workflows.
  - No `package.json`, `src/`, `scripts/`, or `tests/` exist yet.
- **To do now:**
  1. Pin npm dependency versions (CommonJS-compatible, including `uuid@11`, `express@5`, `zod`, `eslint@9` flat config) and initialize `package.json`, `.env.example`, `.gitignore`, ESLint + Prettier configs.
  2. Create folder layout (`src/`, `db/migrations/001_init.sql`, `scripts/`, `tests/`).
  3. Implement `src/config/env.js` (zod-validated env vars, crashes fast on missing/invalid), `src/utils/logger.js` (pino with required redactions), `src/utils/AppError.js`, `src/utils/asyncHandler.js`.
  4. Implement `src/db/pool.js` (`pg` Pool, `query`, `withTransaction`) and `scripts/migrate.js` (tracks applied `.sql` migrations in `schema_migrations`), plus placeholder `scripts/seedAdmin.js` so all npm scripts exist.
  5. Implement middleware (`src/middleware/validate.js`, `src/middleware/errorHandler.js`, `src/middleware/notFound.js`, `src/middleware/rateLimiters.js`), `src/app.js` (helmet, cors, json 10kb, cookie-parser, pino-http, global rate limit, `/api/health`), and `src/server.js` (HTTP + graceful shutdown).
  6. Add Jest + Supertest unit/integration tests for env validation, `AppError`, `validate`, `errorHandler` (including invalid JSON returning contract error shape), `notFound`, `rateLimiters`, `migrate.js`, and `/api/health`.
  7. Run `error-review` (install check, lint, tests, start server + curl/HTTP exercise, privacy grep, contract check), update `ERRORS_LOG.md` & `NEXT_STEPS.md`, and push to `origin/main`.
- **Not in scope / later:**
  - Phase 2 (Auth/OTP/JWT/Me), Phase 3 (Discovery/Blocks), Phase 4 (Chat REST), Phase 5 (Socket.IO), Phase 6 (Reports & Admin — `docs/ADMIN.md`), Phase 7 (Hardening & Deploy docs).
- **Risks & ambiguities:**
  - PostgreSQL (`psql`) is not installed/accessible on PATH in this environment, so `npm run migrate` against a live local Postgres instance cannot run unless a `DATABASE_URL` is configured; migration runner logic will be verified with unit tests and documented clearly for manual DB run.
  - Express 5 forwards rejected async promises natively; keeping `asyncHandler` ensures explicit safety.
  - `uuid` v12+ is ESM-only; pinning `uuid@11` preserves CommonJS `require('uuid')`.
  - PowerShell execution policy blocks `npm.ps1` in this environment (`npm.cmd` works).
- **Info I lack → will research:**
  - Verified npm versions & breaking changes for Express 5, Zod 4, ESLint 9 flat config CommonJS, `express-rate-limit` v8, `pino` v10, and `uuid` v11 CommonJS support.
- **Skills needed:**
  - `prompt-review` (done), `web-research` (done), `error-review` (at end).
- **DONE:**
  - `DONE:` Created `package.json` (pinned dependencies, CommonJS, all `AGENTS.md` scripts), `.env.example`, `.gitignore`, `.prettierrc`, `.prettierignore`, `eslint.config.js`, `jest.config.js`.
  - `DONE:` Created folder layout (`src/modules/*`, `src/services/`, `src/sockets/`, `db/migrations/001_init.sql`).
  - `DONE:` Implemented `src/config/env.js`, `src/utils/logger.js`, `src/utils/AppError.js`, `src/utils/asyncHandler.js`.
  - `DONE:` Implemented `src/db/pool.js`, `scripts/migrate.js`, and Phase 6 placeholder `scripts/seedAdmin.js`.
  - `DONE:` Implemented `src/middleware/validate.js`, `src/middleware/notFound.js`, `src/middleware/errorHandler.js`, `src/middleware/rateLimiters.js`, `src/app.js`, and `src/server.js`.
  - `DONE:` Added tests (`tests/setupEnv.js`, `tests/env.test.js`, `tests/app.test.js`, `tests/migrate.test.js`); `npm run lint`, `npm run format:check`, `npm test` (3 suites, 13 tests), and live HTTP `/api/health` + malformed JSON smoke check all pass. (Note: `npm run migrate` against a live PostgreSQL server was not executed here because PostgreSQL is not installed in this environment.)

## PLANNED — (date) — Project scaffold
- Prompt: (initial kit template)
- Already done: nothing yet (fresh kit)
- To do now: see `research/NEXT_STEPS.md` and `docs/BUILD_PLAN.md` Phase 0
