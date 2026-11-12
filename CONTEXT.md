# Project Context — Anonymous Community Chat (`Anonchat`)

> Living handoff/context summary of completed work, architecture decisions, verification status, and active next steps.

## Repository Layout
- **Backend (`anonchat-backend-kit/anonchat-backend-kit/`):** Node.js + Express (v5, CommonJS) + PostgreSQL + Socket.IO API server.
- **Web (`anonchat-web-kit/anonchat-web-kit/`):** React + TypeScript + Vite + Tailwind CSS starter kit (not started yet).
- **Mobile (`anonchat-mobile-app-kit/anonchat-mobile-app-kit/`):** React Native (Expo) + TypeScript + NativeWind starter kit (not started yet).

## What Has Been Done

### Phase 0 & Phase 1 — Backend Scaffold & Foundation (Committed & Pushed: `623ddf9` on `main`)
1. **Tooling & Configuration:** `package.json` (CommonJS, Node `>=20`, pinned deps), `.env.example`, `.gitignore`, `eslint.config.js` (flat config), `.prettierrc`, `.prettierignore`, `jest.config.js`, and `AGENTS.md` folder layout.
2. **Core Foundation:** `src/config/env.js` (Zod-validated env), `src/utils/logger.js` (`pino` with redaction), `src/db/pool.js` (`Pool`, `query`, `withTransaction`), `db/migrations/001_init.sql`, `scripts/migrate.js`, `src/utils/AppError.js`, `src/utils/asyncHandler.js`, `src/middleware/validate.js`, `src/middleware/notFound.js`, `src/middleware/errorHandler.js`, `src/middleware/rateLimiters.js`, `src/app.js`, `src/server.js`, and `GET /api/health`.

### Phase 2 — Auth & User Profile (Local Working Tree — Ready to Commit/Push)
1. **Anonymous Username & Services:**
   - `src/utils/anonUsername.js`: Generates `Anonymous_<N>` (`[100, 9999]`), retries `23505` collisions up to 10 times per tier and widens range ×10.
   - `src/services/otpService.js`: 6-digit OTP generation, `sha256(code:userId:pepper)` hashing, `timingSafeEqual` verification, 5-attempt invalidation, Apps Script Web App delivery (deleting OTP row on failure and returning `503 EMAIL_SERVICE_UNAVAILABLE`), plus `DEV ONLY` console fallback in development.
   - `src/services/tokenService.js`: HS256 access JWTs, 48-byte opaque refresh tokens stored as SHA-256 hashes with `family_id` rotation and reuse theft detection (revokes entire family on reuse).
2. **Auth Middleware & Rate Limiters:**
   - `src/middleware/auth.js`: `authenticate` verifies Bearer JWT + live DB status (`active`/`suspended`/`banned`/verified) with 15 s cache, cache invalidation helper, and expired suspension auto-lift.
   - `src/middleware/rateLimiters.js`: Added `registerLimiter` (5/hr/IP), `loginLimiter` (10/15m IP+email), `otpCooldownLimiter` (1/60s IP+email), and `otpHourlyLimiter` (5/hr IP+email).
3. **Endpoints Implemented & Mounted in `src/app.js`:**
   - `/api/auth`: `POST /register`, `POST /verify-email`, `POST /resend-otp`, `POST /login` (constant-time bcrypt compare + 5-fail 15-min lockout), `POST /refresh`, `POST /logout`, `POST /forgot-password`, `POST /reset-password` (web `httpOnly` cookie `refresh_token` vs mobile `X-Client: mobile` body `{ refreshToken }`).
   - `/api/me`: `GET /me`, `PATCH /me`, `POST /me/change-password`, `DELETE /me`, and `src/modules/users/users.serializer.js` (`toMe`).
4. **Verification Completed:**
   - `npm.cmd run lint` and `npm.cmd run format:check` passed.
   - `npm.cmd test`: 7 suites, 29 tests passed (unit + Supertest contract tests with mocked DB/OTP services).
   - Live server smoke test on port `4098`: `GET /api/me` unauthenticated → `401 UNAUTHENTICATED`, invalid `POST /api/auth/register` → `400 VALIDATION_ERROR`.
   - *Manual note:* Backend reads `.env` from `anonchat-backend-kit/anonchat-backend-kit/.env` (root `.gitignore` also protects `.env` at repo root). Run `npm.cmd run migrate` once PostgreSQL is configured.

## Active Next Step
- **Phase 3 — Discovery + Blocks (`docs/API_CONTRACT.md`, `docs/AUTH_SECURITY.md`, `docs/DATABASE_SCHEMA.md`):**
  - `toPublicMember(row)` serializer + unit test asserting exact public key set (`id`, `anonUsername`, `gender`, `avatarColor`, `isOnline`, `blockedByMe`)
  - `GET /api/members` (filter `all|male|female|online`, partial `anonUsername` search, cursor pagination, excluding self, unverified/suspended/banned/admin users, and both-way blocks)
  - `POST /api/blocks`, `DELETE /api/blocks/:memberId`, `GET /api/blocks` (blocking ends active conversations)
- **Upcoming Phases:** Phase 4 (Chat REST) → Phase 5 (Socket.IO) → Phase 6 (Reports & Admin per `docs/ADMIN.md`) → Phase 7 (Hardening & Docs).
