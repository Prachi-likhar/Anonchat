# Project Context — Anonymous Community Chat (`Anonchat`)

> Living handoff/context summary of completed work, architecture decisions, verification status, and active next steps.

## Repository Layout
- **Backend (`anonchat-backend-kit/anonchat-backend-kit/`):** Node.js + Express (v5, CommonJS) + PostgreSQL + Socket.IO API server.
- **Web (`anonchat-web-kit/anonchat-web-kit/`):** React + TypeScript + Vite + Tailwind CSS starter kit (not started yet).
- **Mobile (`anonchat-mobile-app-kit/anonchat-mobile-app-kit/`):** React Native (Expo) + TypeScript + NativeWind starter kit (not started yet).

## What Has Been Done

### Phase 0 & Phase 1 — Backend Scaffold & Foundation (Committed & Pushed: `623ddf9` on `main`)
- Tooling, Zod env config (`src/config/env.js`), `pino` redaction logger, `pg` pool + transactions, `db/migrations/001_init.sql`, `scripts/migrate.js`, `AppError`, `asyncHandler`, `validate`, `notFound`, `errorHandler`, `globalLimiter`, `src/app.js`, `src/server.js`, `GET /api/health`.

### Phase 2 — Auth & User Profile (Committed & Pushed: `03ab9fe` on `main`)
- `anonUsername`, `otpService` (Apps Script + dev fallback), `tokenService` (access JWT + refresh rotation/reuse detection), `authenticate` middleware (DB status check + 15 s cache), auth rate limiters, `/api/auth/*`, `/api/me/*`, `CONTEXT.md`, root `.gitignore`.

### Phase 3 — Discovery & Blocks (Committed & Pushed: `f0dc07b` on `main`)
- `presenceService`, `pagination.js` (`escapeLike`, opaque cursors), `toPublicMember` exact-key serializer, `GET /api/members`, and `/api/blocks` (`GET`, `POST` ending active conversation, `DELETE`).

### Phase 4 — Chat REST & Anti-Spam (Local Working Tree — Ready to Commit/Push)
1. **Anti-Spam (`src/services/antiSpam.js`):**
   - Per-user sliding windows: 5 messages / 10 s burst, 20 messages / 60 s, 10 new conversations / hour.
   - Normalized body hash duplicate detection (`>= 3` identical bodies in 60 s -> `429 DUPLICATE_MESSAGE` + `Retry-After`) with DB backstop.
   - Optional `STRICT_FIRST_CONTACT` cold-message guard.
2. **Conversations & Messages (`src/modules/conversations/`):**
   - `conversations.serializer.js`: `canonicalPair`, `toMessage`, `toConversation`.
   - Endpoints mounted in `src/app.js`: `POST /api/conversations` (idempotent active reuse `200` / create or reactivate `201`, `403 USER_BLOCKED`), `GET /api/conversations` (cursor paginated), `GET /api/conversations/:id/messages` (newest first, `before` cursor), `POST /api/conversations/:id/messages` (1–2000 chars trimmed, idempotent `clientMsgId`, `409 CONVERSATION_ENDED`, `403 USER_BLOCKED`, `429`), `POST /api/conversations/:id/read`, `POST /api/conversations/:id/end`, `DELETE /api/conversations/:id` (soft delete; hard-deletes messages when both sides deleted), and `GET /api/unread-count`.
   - Non-participants receive `404 NOT_FOUND` across all conversation-scoped routes.
3. **Verification Completed:**
   - `npm.cmd run lint` and `npm.cmd run format:check` passed.
   - `npm.cmd test`: 11 suites, 47 tests passed (unit + Supertest contract tests with mocked DB).
   - Live server smoke test on port `4096`: `GET /api/conversations` and `GET /api/unread-count` unauthenticated returned `401 UNAUTHENTICATED`.

## Active Next Step
- **Phase 5 — Real-time Socket.IO (`docs/REALTIME.md`, `docs/API_CONTRACT.md`):**
  - `src/sockets/index.js` + handlers attached to HTTP server in `src/server.js`
  - JWT + DB status auth middleware on `io.use`, `user:<id>` rooms, JWT expiry disconnect timer
  - Presence events (`presence` only to conversation peers), `message:new` delivery on REST send, `typing:start`/`typing:stop` throttled relay, `message:read` on REST read, `conversation:ended` on REST end/block, `force-logout` on password change/admin suspend/ban
  - Two-client Socket.IO integration script/tests in `tests/`
- **Upcoming Phases:** Phase 6 (Reports & Admin per `docs/ADMIN.md`) → Phase 7 (Hardening & Docs).
