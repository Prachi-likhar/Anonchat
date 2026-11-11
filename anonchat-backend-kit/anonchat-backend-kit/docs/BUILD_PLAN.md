# Build Plan (do phases in order; each ends with error-review + PROGRESS_LOG update)

**Phase 0 — Scaffold:** `npm init`, install deps (check versions), eslint/prettier, folder layout from AGENTS.md, `.env.example`, `.gitignore`, `config/env.js` (zod), `app.js`/`server.js`, `/api/health`. *Accept:* `npm run dev` serves health; lint passes.

**Phase 1 — Foundation:** pg pool, migration runner + `001_init.sql`, `AppError`, `asyncHandler`, `validate` middleware, `errorHandler`, pino logger with redaction, global rate limiter. *Accept:* `npm run migrate` creates all tables on a fresh DB; invalid JSON returns contract error shape.

**Phase 2 — Auth:** register, OTP service (+dev fallback), verify-email, resend-otp, login (lockout), refresh rotation w/ reuse detection, logout, forgot/reset password, `authenticate` middleware (DB status check), `GET/PATCH /me`, change-password, delete account. *Accept:* full flow works via curl; wrong OTP ×5 invalidates; banned user can't log in; tests for each.

**Phase 3 — Discovery + blocks:** `GET /members` with filter/search/pagination and exclusions, `toPublicMember`, blocks endpoints. *Accept:* filters correct; blocked users vanish both ways; privacy unit test passes.

**Phase 4 — Chat REST:** conversations create/list, messages list/send, read, end, delete, unread-count, anti-spam. *Accept:* non-participant gets 404; blocked send rejected; duplicate/rate limits work; pagination stable.

**Phase 5 — Real-time:** Socket.IO auth, presence, `message:new`, typing, read receipts, ended/force-logout. *Accept:* two clients (script in `tests/`) exchange messages and typing events; offline→online transitions emitted.

**Phase 6 — Reports & Admin:** reports with snapshot, all admin endpoints, audit log, seed admin. *Accept:* non-admin 403; suspend kicks active socket; stats correct.

**Phase 7 — Hardening & docs:** full test run, security checklist, load sanity test of message sending, `docs/DEPLOY.md` (env, Postgres, reverse proxy with WebSocket upgrade, HTTPS, backups), Postman/Thunder collection or `openapi.yaml`. *Accept:* checklist all ticked; README quick-start verified on clean clone.
