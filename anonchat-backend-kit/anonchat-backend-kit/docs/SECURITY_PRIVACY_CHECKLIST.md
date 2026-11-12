# Security & Privacy Checklist (run before every "done")

## Privacy (the product's whole point)
- [x] No endpoint other than `GET /me` (and auth responses) returns `email` or `fullName` to a normal user.
- [x] `PublicMember` contains only: id, anonUsername, gender, avatarColor, isOnline, blockedByMe.
- [x] No `lastSeen`, `createdAt`, join date or exact presence timestamps exposed to other users (these enable de-anonymisation).
- [x] Conversation access = participant check on EVERY route and socket event; non-participants get 404.
- [x] Logs contain no emails/names/tokens/passwords/OTPs/message bodies.
- [x] Admin cannot read arbitrary chats; only report snapshots.
- [x] Responses don't reveal whether an email exists (register/forgot/resend).
- [ ] Message body is rendered as plain text (no `dangerouslySetInnerHTML`), links never auto-opened. *(Client-side responsibility in web & mobile kits)*
- [x] Known limitation (show in onboarding on web/mobile): in a small community, gender + online status can let people guess identities. Never add real-world-identifying profile fields (photo, bio, age, city).

## Auth & session
- [x] bcrypt cost 12; password never returned; min 8 chars.
- [x] JWT access 15 min, HS256, secret ≥32 bytes from env; refresh tokens stored HASHED (sha256) in DB, rotated; reuse of a revoked token revokes that user's whole token family.
- [x] Banned/suspended status re-checked from DB on every authenticated request and socket connect (don't trust the token alone).
- [x] CORS allow-list from env `CORS_ORIGINS`, credentials true, never `*`.
- [x] helmet, body size limit 10kb, `trust proxy` set correctly in prod.
- [x] Parameterised SQL only; zod validation on every body/query/param.
- [ ] Web: access token in memory only (not localStorage). Mobile: tokens in secure store only. *(Client-side responsibility in web & mobile kits)*
