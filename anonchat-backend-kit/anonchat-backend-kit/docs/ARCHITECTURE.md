# Architecture
```
Web (React) ─┐                         ┌─ PostgreSQL
App (RN)  ───┼─ HTTPS REST + Socket.IO ─┤  (users, conversations, messages, blocks, reports…)
             │      Express API         └─ Google Apps Script (OTP email) ─► Google Sheet (send log)
```
- **Stateless API** (JWT) so it can scale horizontally. Socket.IO scales later with `@socket.io/redis-adapter` (document this; not needed for v1). Presence counts live in memory for v1; note the Redis upgrade path in DECISIONS.
- **Request flow:** helmet → cors → json(10kb) → cookieParser → pino-http → global rate limit → routes → (authenticate → loadUserStatus → requireRole?) → validate → controller → service → db → errorHandler.
- **Authorization lives in services**, not just middleware: every conversation query includes `WHERE (user_a=$me OR user_b=$me)`.
- **Anonymity by construction:** a single serializer `toPublicMember(row)` is the ONLY way another user's data leaves the server. Add a unit test that asserts its exact key set.
- **Transactions** for: register (user + otp), message send (insert + update conversation), block (insert + end conversations), delete conversation, ban (status + revoke tokens).
- **Time:** always `timestamptz`, UTC.
- **Soft vs hard delete:** delete-conversation sets per-user `deleted_at`; a nightly (or on-delete) cleanup hard-deletes messages when both sides deleted. Reports keep their own snapshot, so evidence survives deletion.
