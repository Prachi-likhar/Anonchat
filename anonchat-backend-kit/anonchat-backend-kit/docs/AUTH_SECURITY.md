# Authentication, Authorization & Security

## Registration → verification
1. Validate with zod. Lower-case + trim email. Hash password: `bcrypt.hash(pw, 12)`.
2. In one transaction insert user (unverified, generated anon username) and an OTP row.
3. Send OTP through `otpService` (Apps Script). Respond 201 with a generic message. If email already exists and is verified → still respond 201 (no enumeration) and silently send nothing (or send "you already have an account" mail via Apps Script `type:"notice"`). If exists but unverified → resend OTP.
4. `verify-email`: find latest unconsumed OTP, check expiry, compare hash with `crypto.timingSafeEqual`, increment attempts (≥5 → invalidate), set `email_verified_at`, issue tokens.

## Login
- Constant-ish time: always run `bcrypt.compare` (against a dummy hash if user not found).
- Check order: lock → password → verified → status (banned/suspended; auto-lift if `suspended_until < now()`).
- 5 failed attempts → `locked_until = now()+15min`; reset on success.

## Tokens
- Access JWT (HS256): `{sub:userId, role}`, 15 min. Middleware `authenticate` verifies, then loads `status/role` from DB (small indexed query; cache 10–30 s in memory with explicit invalidation on ban/suspend).
- Refresh: 48 random bytes base64url, store `sha256` only. Rotate on each use: mark old `revoked_at`, `replaced_by`. If a revoked token is presented → revoke whole `family_id` (theft detection) and return 401.
- Web gets cookie; mobile gets body (see API contract). Logout revokes the presented token.
- On ban/suspend/password change: revoke all refresh tokens of the user and emit `force-logout` via socket.

## CORS
`cors({ origin: fn checking CORS_ORIGINS allow-list, credentials: true, methods, allowedHeaders:['Content-Type','Authorization','X-Client'] })`. React Native requests have no Origin header → allow requests with no Origin only for non-cookie flows.

## Rate limiting & spam (see API contract numbers)
- `express-rate-limit` for IP-level limits (login, register, OTP, global).
- Per-user message limits in `services/antiSpam.js`: sliding window in memory (Map) for v1 — keep behind an interface so Redis can replace it; also verify with a DB count as a backstop for duplicates.
- Duplicate detection: normalise body (trim, lowercase, collapse whitespace) → hash; ≥3 same hash within 60 s in a conversation → 429 `DUPLICATE_MESSAGE`.
- Optional: first message to a new person limited to 1 until they reply (anti-cold-spam). Implement behind env flag `STRICT_FIRST_CONTACT=true`.

## Blocking rules (enforced in SQL, not just UI)
- `POST /conversations`, `POST /messages`, member discovery and socket delivery all check `NOT EXISTS (SELECT 1 FROM blocks WHERE (blocker_id=$me AND blocked_id=$other) OR (blocker_id=$other AND blocked_id=$me))`.
- Blocking ends the active conversation and emits `conversation:ended`. Blocked user is NOT told they were blocked (they see the conversation as ended).
- Block must never reveal itself through errors to the blocked user in a way that leaks identity — it's anonymous anyway; use `CONVERSATION_ENDED`.

## "RLS" without Supabase
Authorization is enforced in the service layer and verified by tests (see TESTING.md). Optional hardening: create a limited DB role `app_user`, enable RLS on `messages`/`conversations`, and `SET LOCAL app.user_id = $1` inside each request transaction. Do this only after v1 works; log as a decision.

## Other
- `helmet()`, `express.json({limit:'10kb'})`, `app.set('trust proxy', 1)` in prod, hide `X-Powered-By`.
- Centralised `errorHandler` returns the contract error shape; never leaks stack traces in prod.
- pino redaction: `req.headers.authorization`, `req.headers.cookie`, `*.password`, `*.otp`, `*.email`, `*.body`.
