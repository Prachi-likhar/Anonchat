# Security & Privacy Checklist (run before every "done")

## Privacy (the product's whole point)
- [ ] No endpoint other than `GET /me` (and auth responses) returns `email` or `fullName` to a normal user.
- [ ] `PublicMember` contains only: id, anonUsername, gender, avatarColor, isOnline, blockedByMe.
- [ ] No `lastSeen`, `createdAt`, join date or exact presence timestamps exposed to other users (these enable de-anonymisation).
- [ ] Conversation access = participant check on EVERY route and socket event; non-participants get 404.
- [ ] Logs contain no emails/names/tokens/passwords/OTPs/message bodies.
- [ ] Admin cannot read arbitrary chats; only report snapshots.
- [ ] Responses don't reveal whether an email exists (register/forgot/resend).
- [ ] Message body is rendered as plain text (no `dangerouslySetInnerHTML`), links never auto-opened.
- [ ] Known limitation (show in onboarding): in a small community, gender + online status can let people guess identities. Never add real-world-identifying profile fields (photo, bio, age, city).

## Auth & session
- [ ] bcrypt cost 12; password never returned; min 8 chars.
- [ ] JWT access 15 min, HS256, secret ≥32 bytes from env; refresh tokens stored HASHED (sha256) in DB, rotated; reuse of a revoked token revokes that user's whole token family.
- [ ] Banned/suspended status re-checked from DB on every authenticated request and socket connect (don't trust the token alone).
- [ ] CORS allow-list from env `CORS_ORIGINS`, credentials true, never `*`.
- [ ] helmet, body size limit 10kb, `trust proxy` set correctly in prod.
- [ ] Parameterised SQL only; zod validation on every body/query/param.
- [ ] Web: access token in memory only (not localStorage). Mobile: tokens in secure store only.
