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

### Phase 5 — Real-time Socket.IO (Ready & Pushing to `main`)
1. **Socket.IO Server (`src/sockets/` & `src/server.js`):**
   - `src/sockets/index.js`: Attached Socket.IO (`/socket.io`, `websocket` + `polling`, same `CORS_ORIGINS` allow-list) to the HTTP server; `io.use` authenticates `socket.handshake.auth.token` + live DB account status via `loadUserAuthState`.
   - `src/sockets/handlers.js`: Joins `user:<id>`, schedules JWT expiry disconnect timer, tracks multi-device presence via `presenceService`, broadcasts `presence` only to non-blocked conversation peers, updates `users.last_seen_at` on final disconnect, and relays throttled `typing:start`/`typing:stop` only for active non-blocked participants.
   - `src/sockets/emitter.js`: Wired into REST flows for `message:new` (per-recipient `mine`), `message:read`, `conversation:ended` (end & block), and `force-logout` (password change & ready for admin suspend/ban).
2. **Verification Completed:**
   - `npm.cmd run lint` and `npm.cmd run format:check` passed.
   - `npm.cmd test`: 12 suites, 49 tests passed (including real two-client Socket.IO tests in `tests/sockets.test.js` with mocked DB).

## Active Next Step
- **Phase 6 — Reports & Admin (`docs/ADMIN.md`, `docs/API_CONTRACT.md`):**
  - `src/modules/reports/` (`POST /api/reports` storing snapshot of last 30 messages for participants, 10/day rate limit)
  - `src/middleware/requireAdmin.js` (`role === 'admin'`, `403 FORBIDDEN` otherwise)
  - `src/modules/admin/` (`GET /admin/stats`, `GET /admin/users`, `GET /admin/users/:id`, `POST /admin/users/:id/suspend`, `POST /admin/users/:id/ban`, `POST /admin/users/:id/reinstate`, `POST /admin/users/:id/role`, `GET /admin/reports`, `GET /admin/reports/:id`, `PATCH /admin/reports/:id`, `GET /admin/activity`, `GET /admin/online`) with `admin_audit_log`, self-ban/last-admin guards, `force-logout` + token revocation, and `scripts/seedAdmin.js`
- **Upcoming Phase:** Phase 7 (Hardening & Docs).
