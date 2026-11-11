# Database Schema
Full DDL: `db/schema.sql` (copy to `db/migrations/001_init.sql`). Summary:

| Table | Key points |
|---|---|
| users | `anon_username` unique & permanent; `full_name`, `email` private; `status` active/suspended/banned; `email_verified_at` null until OTP verified |
| otp_codes | hashed codes, 10-min expiry, 5 attempts, one active per purpose (new code consumes old) |
| refresh_tokens | hashed opaque tokens, `family_id` for reuse detection |
| conversations | exactly one row per pair (`user_a < user_b` canonical order); per-side delete + read timestamps |
| messages | 1–2000 chars; `(conversation_id, sender_id, client_msg_id)` unique for idempotent sends |
| blocks | directional; BOTH directions are checked everywhere |
| reports | with JSON snapshot of last 30 messages |
| admin_audit_log | every admin action |

## Rules the code must implement
- Canonicalise pair: `[a,b] = [x,y].sort()` (UUID string compare matches Postgres `uuid` ordering — verify in a test).
- "Unread for me" = messages where `sender_id <> me AND created_at > my_last_read_at` (or `read_at IS NULL`).
- Anonymous username generation: loop max 10 tries: `Anonymous_` + random int in [100, 9999]; after 10 collisions widen the range ×10. Rely on the UNIQUE constraint (catch error 23505) instead of check-then-insert.
- Deleting a user (`DELETE /me`): cascade removes messages they sent — acceptable; document it.
- Seed script `seed:admin`: creates the admin from `SUPER_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` with `role='admin'`, verified, anon name `Anonymous_Admin` (admin is not discoverable: exclude `role='admin'` from members).
