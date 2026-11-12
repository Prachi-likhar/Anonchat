# Project Context — Anonymous Community Chat (`Anonchat`)

> Living handoff/context summary of completed work, architecture decisions, verification status, and active next steps.

## Repository Layout
- **Backend (`anonchat-backend-kit/anonchat-backend-kit/`):** Node.js + Express (v5, CommonJS) + PostgreSQL + Socket.IO API server.
- **Web (`anonchat-web-kit/anonchat-web-kit/`):** React + TypeScript + Vite + Tailwind CSS starter kit (not started yet).
- **Mobile (`anonchat-mobile-app-kit/anonchat-mobile-app-kit/`):** React Native (Expo) + TypeScript + NativeWind starter kit (not started yet).

## What Has Been Done

### Phase 0 & Phase 1 — Backend Scaffold & Foundation (`623ddf9`)
- Tooling, Zod env config (`src/config/env.js`), `pino` redaction logger, `pg` pool + transactions, `db/migrations/001_init.sql`, `scripts/migrate.js`, `AppError`, `asyncHandler`, `validate`, `notFound`, `errorHandler`, `globalLimiter`, `src/app.js`, `src/server.js`, `GET /api/health`.

### Phase 2 — Auth & User Profile (`03ab9fe`)
- `anonUsername`, `otpService`, `tokenService`, `authenticate` middleware, auth rate limiters, `/api/auth/*`, `/api/me/*`, `CONTEXT.md`, root `.gitignore`.

### Phase 3 — Discovery & Blocks (`f0dc07b`)
- `presenceService`, `pagination.js`, `toPublicMember`, `GET /api/members`, `/api/blocks/*`.

### Phase 4 — Chat REST & Anti-Spam (`c045302`)
- `antiSpam.js`, `conversations` module (`/api/conversations/*`, `/api/unread-count`).

### Phase 5 — Real-time Socket.IO (`4d3fd16`)
- `src/sockets/` (`index.js`, `handlers.js`, `emitter.js`) wired into `src/server.js`, `conversations.service.js`, `blocks.service.js`, and `users.service.js`.

### Phase 6 — Reports & Admin (`docs/ADMIN.md`) (Ready & Pushing to `main`)
1. **Reports (`src/modules/reports/`):**
   - `POST /api/reports`: Rate-limited (`reportsLimiter`, 10/day per user), rejects self-reporting and reporting admin accounts, validates conversation participation, and stores a chronological snapshot of the last 30 messages using anon usernames only.
2. **Admin & Moderation (`src/middleware/requireAdmin.js`, `src/modules/admin/`, `scripts/seedAdmin.js`):**
   - Router-level `authenticate` + `requireAdmin` (`403 FORBIDDEN` for non-admins).
   - Endpoints mounted at `/api/admin`: `GET /stats`, `GET /users`, `GET /users/:id`, `POST /users/:id/suspend`, `POST /users/:id/ban`, `POST /users/:id/reinstate`, `POST /users/:id/role` (super-admin only via `SUPER_ADMIN_EMAIL`), `GET /reports`, `GET /reports/:id` (snapshot labeled `Reporter` / `Reported` with anon usernames only), `PATCH /reports/:id` (workflow `open -> reviewing -> resolved/dismissed` + atomic suspend/ban), `GET /activity`, `GET /online`.
   - Every moderation action writes `admin_audit_log`, prevents self-ban and banning/suspending the last active admin, revokes refresh tokens + emits `force-logout`, and hides `fullName` unless `ADMIN_CAN_SEE_FULL_NAME=true`.
   - `scripts/seedAdmin.js`: Idempotently seeds `Anonymous_Admin` from `SUPER_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.
3. **Verification Completed:**
   - `npm.cmd run lint` and `npm.cmd run format:check` passed.
   - `npm.cmd test`: 13 suites, 56 tests passed (with mocked DB).
   - Live server smoke test on port `4095`: `GET /api/admin/stats` and `POST /api/reports` unauthenticated returned `401 UNAUTHENTICATED`.

## Active Next Step
- **Phase 7 — Hardening & Docs (`docs/BUILD_PLAN.md`, `docs/SECURITY_PRIVACY_CHECKLIST.md`):**
  - `docs/DEPLOY.md` (env, Postgres, reverse proxy with WebSocket upgrade, HTTPS, backups)
  - `openapi.yaml` (or Postman/Thunder Client collection)
  - Load sanity test script for message sending
  - Full `docs/SECURITY_PRIVACY_CHECKLIST.md` verification and README quick-start check
