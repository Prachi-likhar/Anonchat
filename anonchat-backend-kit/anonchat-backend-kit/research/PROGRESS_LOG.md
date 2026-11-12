# Progress Log
Newest entry at the top. Every prompt gets a PLANNED entry before coding and DONE lines as work completes.

## PLANNED — 2026-11-12 — Phase 2 (Auth & User Profile) + Context File
- **Prompt (my words):** Create a project context file summarizing completed work and next steps, then start and implement Phase 2 of `docs/BUILD_PLAN.md`: anonymous username generator, OTP service (with Apps Script + dev console fallback), token service (access JWT + opaque refresh rotation with `family_id` reuse detection), `authenticate` middleware (DB status check + short cache), auth rate limiters, `/api/auth/*` routes, `/api/me/*` routes, and comprehensive tests.
- **Already done:**
  - Phase 0 & Phase 1 scaffold, config (`src/config/env.js`), logger (`src/utils/logger.js`), DB pool (`src/db/pool.js`), migration runner (`scripts/migrate.js`, `db/migrations/001_init.sql`), `AppError`, `asyncHandler`, `validate`, `notFound`, `errorHandler`, `globalLimiter`, `/api/health`, and 13 passing tests (committed & pushed as `623ddf9`).
  - Created `CONTEXT.md` and root `.gitignore`.
- **To do now:**
  1. Implement `src/utils/anonUsername.js` (random 3–5 digit `Anonymous_<N>`, retries on unique constraint `23505`, widens range ×10 after 10 collisions).
  2. Implement `src/services/otpService.js` (`generateOtp`, `hashOtp`, `createAndSendOtp` via Apps Script or dev fallback, `verifyOtp` with `timingSafeEqual` and 5-attempt invalidation).
  3. Implement `src/services/tokenService.js` (HS256 access JWT, 48-byte base64url refresh token hashed with sha256, `family_id` rotation & reuse theft detection, revoke single/all tokens).
  4. Implement `src/middleware/auth.js` (`authenticate` verifying Bearer JWT + DB `status/role` check with short TTL cache and explicit invalidation helper, auto-lifting expired suspensions) and Phase 2 rate limiters in `src/middleware/rateLimiters.js`.
  5. Implement `src/modules/auth/` (`auth.schemas.js`, `auth.service.js`, `auth.controller.js`, `auth.routes.js`) covering `register`, `verify-email`, `resend-otp`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`.
  6. Implement `src/modules/users/` (`users.schemas.js`, `users.service.js`, `users.controller.js`, `users.routes.js`) covering `GET /me`, `PATCH /me`, `POST /me/change-password`, `DELETE /me`.
  7. Mount `/api/auth` and `/api/me` in `src/app.js`.
  8. Write Jest + Supertest unit/integration tests for all Phase 2 components, run `error-review` (`lint`, `format:check`, `test`, privacy grep, live smoke check), and update `CONTEXT.md`, `PROGRESS_LOG.md`, `ERRORS_LOG.md`, and `NEXT_STEPS.md`.
- **Not in scope / later:**
  - Phase 3 (Discovery/Blocks), Phase 4 (Chat REST), Phase 5 (Socket.IO — note `force-logout` emit hook will be wired when `sockets` exists in Phase 5), Phase 6 (Reports & Admin — `docs/ADMIN.md`), Phase 7 (Hardening & Deploy).
- **Risks & ambiguities:**
  - PostgreSQL is not installed locally in this environment (or if user configured a remote DB in root `.env`, note backend reads `.env` from `anonchat-backend-kit/anonchat-backend-kit/` unless `DOTENV_CONFIG_PATH` is set or `.env` is copied there). Tests mock DB/service layers cleanly for unit/API contract verification without needing a live Postgres server, and can also run against `anonchat_test` when Postgres is available.
  - Web vs mobile refresh token transport: Web uses `httpOnly` cookie `refresh_token` (`path: '/api/auth'`, `SameSite=Lax`, `Secure` from `COOKIE_SECURE`); Mobile (`X-Client: mobile`) sends/receives `{ refreshToken }` in JSON body.
  - `resend-otp` cooldown (60s) and `EMAIL_NOT_VERIFIED` re-send on login must never leak whether an email exists on `register`/`resend-otp`/`forgot-password`.
- **Info I lack → will research:**
  - Verified Google Apps Script Web App 302 redirect behavior with `axios` and Gmail daily quota (`DECISIONS.md` updated).
- **Skills needed:**
  - `prompt-review` (done), `web-research` (done), `error-review` (at end).
- **DONE:**
  - `DONE:` Created root `CONTEXT.md` and root `.gitignore` (protecting `.env`).
  - `DONE:` Implemented `src/utils/anonUsername.js`, `src/services/otpService.js`, `src/services/tokenService.js`, `src/middleware/auth.js`, and auth rate limiters in `src/middleware/rateLimiters.js`.
  - `DONE:` Implemented `src/modules/auth/` (`auth.schemas.js`, `auth.service.js`, `auth.controller.js`, `auth.routes.js`) and `src/modules/users/` (`users.serializer.js`, `users.schemas.js`, `users.service.js`, `users.controller.js`, `users.routes.js`), mounted in `src/app.js`.
  - `DONE:` Added tests (`tests/anonUsername.test.js`, `tests/otpService.test.js`, `tests/tokenService.test.js`, `tests/authAndUsers.test.js`); `npm run lint`, `npm run format:check`, `npm test` (7 suites, 29 tests), and live HTTP checks (`/api/me` 401, `/api/auth/register` 400) all pass.

## DONE — 2026-11-12 — Phase 0 & Phase 1 (Scaffold + Foundation) & Push to Git
- `DONE:` Created `package.json` (pinned dependencies, CommonJS, all `AGENTS.md` scripts), `.env.example`, `.gitignore`, `.prettierrc`, `.prettierignore`, `eslint.config.js`, `jest.config.js`.
- `DONE:` Created folder layout (`src/modules/*`, `src/services/`, `src/sockets/`, `db/migrations/001_init.sql`).
- `DONE:` Implemented `src/config/env.js`, `src/utils/logger.js`, `src/utils/AppError.js`, `src/utils/asyncHandler.js`.
- `DONE:` Implemented `src/db/pool.js`, `scripts/migrate.js`, and Phase 6 placeholder `scripts/seedAdmin.js`.
- `DONE:` Implemented `src/middleware/validate.js`, `src/middleware/notFound.js`, `src/middleware/errorHandler.js`, `src/middleware/rateLimiters.js`, `src/app.js`, and `src/server.js`.
- `DONE:` Added tests (`tests/setupEnv.js`, `tests/env.test.js`, `tests/app.test.js`, `tests/migrate.test.js`); `npm run lint`, `npm run format:check`, `npm test` (3 suites, 13 tests), and live HTTP `/api/health` + malformed JSON smoke check all pass.
- `DONE:` Committed as `623ddf9` and pushed directly to `origin/main`.
