# Progress Log
Newest entry at the top. Every prompt gets a PLANNED entry before coding and DONE lines as work completes.

## DONE — 2026-11-12 — Phase 3 (Discovery + Blocks)
- **Prompt (my words):** Push Phase 2 to `origin/main` (`03ab9fe`), then start and complete Phase 3 of `docs/BUILD_PLAN.md`: `toPublicMember` serializer with exact public key test, `presenceService` in-memory connection map, `GET /api/members` discovery with filtering/search/pagination and exclusions (self, unverified, suspended/banned, admin, two-way blocks), and `/api/blocks` (`POST`, `DELETE`, `GET`) ending active conversations in a transaction on block.
- **Already done:**
  - Phase 0 & Phase 1 scaffold/foundation (`623ddf9`).
  - Phase 2 Auth, OTP, token rotation, `/api/auth/*`, `/api/me/*`, and `CONTEXT.md` (`03ab9fe`).
- **To do now:**
  1. Implement `src/services/presenceService.js` (in-memory `Map<userId, connectionCount>`).
  2. Add `toPublicMember` to `src/modules/users/users.serializer.js` (strict exact public key set: `id`, `anonUsername`, `gender`, `avatarColor`, `isOnline`, `blockedByMe`).
  3. Add cursor pagination + `ILIKE` escape helpers in `src/utils/pagination.js`.
  4. Implement `src/modules/members/` (`members.schemas.js`, `members.service.js`, `members.controller.js`, `members.routes.js`) for `GET /api/members`.
  5. Implement `src/modules/blocks/` (`blocks.schemas.js`, `blocks.service.js`, `blocks.controller.js`, `blocks.routes.js`) for `POST /api/blocks`, `DELETE /api/blocks/:memberId`, `GET /api/blocks` (transactional block + end active conversation).
  6. Mount `/api/members` and `/api/blocks` in `src/app.js`.
  7. Write Jest + Supertest tests (`tests/membersAndBlocks.test.js` including `toPublicMember` exact-key & privacy leak tests), run `error-review` (`lint`, `format:check`, `test`, privacy grep, live smoke test), and update `CONTEXT.md`, `PROGRESS_LOG.md`, `ERRORS_LOG.md`, and `NEXT_STEPS.md`.
- **Not in scope / later:**
  - Phase 4 (Chat REST), Phase 5 (Socket.IO — will wire `conversation:ended` emit on block), Phase 6 (Reports & Admin — `docs/ADMIN.md`), Phase 7 (Hardening & Deploy).
- **Risks & ambiguities:**
  - `toPublicMember` must never include `email`, `fullName`, `lastSeen`, or `createdAt`.
  - Blocking must hide users in both directions in discovery and reject self-blocking or blocking non-existent/admin accounts without leaking admin identity.
  - `ILIKE` search must escape `%`, `_`, and `\` so wildcards cannot match arbitrary usernames.
- **Info I lack → will research:**
  - None (covered by existing `docs/API_CONTRACT.md`, `docs/DATABASE_SCHEMA.md`, `docs/AUTH_SECURITY.md`, `docs/REALTIME.md`).
- **Skills needed:**
  - `prompt-review` (done), `error-review` (done).
- **DONE:**
  - `DONE:` Committed and pushed Phase 2 (`03ab9fe`) to `origin/main`.
  - `DONE:` Implemented `src/services/presenceService.js`, `src/utils/pagination.js`, and `toPublicMember` in `src/modules/users/users.serializer.js`.
  - `DONE:` Implemented `src/modules/members/` (`GET /api/members`) and `src/modules/blocks/` (`GET/POST /api/blocks`, `DELETE /api/blocks/:memberId`), mounted in `src/app.js`.
  - `DONE:` Added `tests/presenceAndPagination.test.js` and `tests/membersAndBlocks.test.js`; `npm run lint`, `npm run format:check`, `npm test` (9 suites, 39 tests), privacy grep, and live HTTP smoke checks all pass.

## DONE — 2026-11-12 — Phase 2 (Auth & User Profile) + Context File
- `DONE:` Created root `CONTEXT.md` and root `.gitignore` (protecting `.env`).
- `DONE:` Implemented `src/utils/anonUsername.js`, `src/services/otpService.js`, `src/services/tokenService.js`, `src/middleware/auth.js`, and auth rate limiters in `src/middleware/rateLimiters.js`.
- `DONE:` Implemented `src/modules/auth/` and `src/modules/users/`, mounted in `src/app.js`.
- `DONE:` Committed as `03ab9fe` and pushed directly to `origin/main`.

## DONE — 2026-11-12 — Phase 0 & Phase 1 (Scaffold + Foundation) & Push to Git
- `DONE:` Created `package.json`, `.env.example`, `.gitignore`, `.prettierrc`, `.prettierignore`, `eslint.config.js`, `jest.config.js`.
- `DONE:` Implemented `src/config/env.js`, `src/utils/logger.js`, `src/utils/AppError.js`, `src/utils/asyncHandler.js`, `src/db/pool.js`, `scripts/migrate.js`, middleware, `src/app.js`, `src/server.js`.
- `DONE:` Committed as `623ddf9` and pushed directly to `origin/main`.
