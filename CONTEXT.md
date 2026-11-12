# Project Context — Anonymous Community Chat (`Anonchat`)

> Living handoff/context summary of completed work, architecture decisions, verification status, and active next steps.

## Repository Layout
- **Backend (`anonchat-backend-kit/anonchat-backend-kit/`):** Node.js + Express (v5, CommonJS) + PostgreSQL + Socket.IO API server.
- **Web (`anonchat-web-kit/anonchat-web-kit/`):** React + TypeScript + Vite + Tailwind CSS starter kit (not started yet).
- **Mobile (`anonchat-mobile-app-kit/anonchat-mobile-app-kit/`):** React Native (Expo) + TypeScript + NativeWind starter kit (not started yet).

## What Has Been Done

### Phase 0 & Phase 1 — Backend Scaffold & Foundation (Committed & Pushed: `623ddf9` on `main`)
- Tooling (`package.json`, `.env.example`, `.gitignore`, `eslint.config.js`, `.prettierrc`, `jest.config.js`), `src/config/env.js`, `src/utils/logger.js`, `src/db/pool.js`, `db/migrations/001_init.sql`, `scripts/migrate.js`, `AppError`, `asyncHandler`, `validate`, `notFound`, `errorHandler`, `globalLimiter`, `src/app.js`, `src/server.js`, `GET /api/health`.

### Phase 2 — Auth & User Profile (Committed & Pushed: `03ab9fe` on `main`)
- `src/utils/anonUsername.js`, `src/services/otpService.js`, `src/services/tokenService.js`, `src/middleware/auth.js`, auth rate limiters, `/api/auth/*` (`register`, `verify-email`, `resend-otp`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`), `/api/me/*` (`GET`, `PATCH`, `change-password`, `DELETE`), and `CONTEXT.md` + root `.gitignore`.

### Phase 3 — Discovery & Blocks (Local Working Tree — Ready to Commit/Push)
1. **Presence & Pagination Utilities:**
   - `src/services/presenceService.js`: In-memory multi-device `Map<userId, connectionCount>` (`addConnection`, `removeConnection`, `isOnline`, `getOnlineUserIds`, `getOnlineCount`).
   - `src/utils/pagination.js`: `escapeLike` (`%`, `_`, `\`), opaque base64url cursor `encodeCursor`/`decodeCursor` (400 on malformed cursor), `slicePage`.
2. **Public Serializer & Endpoints:**
   - `src/modules/users/users.serializer.js`: Added `toPublicMember` returning exact keys (`id`, `anonUsername`, `gender`, `avatarColor`, `isOnline`, `blockedByMe`).
   - `src/modules/members/`: `GET /api/members` supporting `filter=all|male|female|online`, `search`, `limit`, and `cursor`, excluding self, unverified, suspended/banned, `role='admin'`, and two-way blocks.
   - `src/modules/blocks/`: `POST /api/blocks` (transactional block + end active conversation), `DELETE /api/blocks/:memberId`, and `GET /api/blocks`, mounted in `src/app.js`.
3. **Verification Completed:**
   - `npm.cmd run lint` and `npm.cmd run format:check` passed.
   - `npm.cmd test`: 9 suites, 39 tests passed (unit + Supertest contract & privacy tests with mocked DB).
   - Live server smoke test on port `4097`: `GET /api/members` and `GET /api/blocks` unauthenticated returned `401 UNAUTHENTICATED`.

## Active Next Step
- **Phase 4 — Chat REST (`docs/API_CONTRACT.md`, `docs/AUTH_SECURITY.md`, `docs/DATABASE_SCHEMA.md`):**
  - `src/services/antiSpam.js` (20 msgs/min, 5 msgs/10s burst, >=3 identical normalized bodies in 60s -> `DUPLICATE_MESSAGE`, optional `STRICT_FIRST_CONTACT`)
  - `src/modules/conversations/`: `POST /conversations`, `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`, `POST /conversations/:id/read`, `POST /conversations/:id/end`, `DELETE /conversations/:id`, `GET /unread-count`
- **Upcoming Phases:** Phase 5 (Socket.IO) → Phase 6 (Reports & Admin per `docs/ADMIN.md`) → Phase 7 (Hardening & Docs).
