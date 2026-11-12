# Next Steps
Phase 3 (Discovery + Blocks) is complete.

Next build phase:
1. **Phase 4 — Chat REST (`docs/API_CONTRACT.md`, `docs/AUTH_SECURITY.md`, `docs/DATABASE_SCHEMA.md`):**
   - `src/services/antiSpam.js` (per-user sliding window 20/min and 5/10s burst, normalized duplicate hash >=3 in 60s -> `429 DUPLICATE_MESSAGE`, `STRICT_FIRST_CONTACT` flag, new conversations 10/hour)
   - `src/modules/conversations/`:
     - `POST /api/conversations` (`{ memberId }`, canonical `user_a < user_b`, idempotent active conversation, 403 `USER_BLOCKED` if either side blocked)
     - `GET /api/conversations` (excluding ones I soft-deleted, newest activity first, cursor pagination)
     - `GET /api/conversations/:id/messages` (newest first, `before` cursor, 404 if non-participant)
     - `POST /api/conversations/:id/messages` (1–2000 chars trimmed, idempotent `clientMsgId`, 403 `USER_BLOCKED`, 409 `CONVERSATION_ENDED`, 429 `RATE_LIMITED`/`DUPLICATE_MESSAGE`)
     - `POST /api/conversations/:id/read` (marks incoming messages read -> 204)
     - `POST /api/conversations/:id/end` (ends conversation -> 204)
     - `DELETE /api/conversations/:id` (soft delete for caller; hard-delete messages when both sides deleted -> 204)
     - `GET /api/unread-count` (`{ total }`)
   - Jest + Supertest coverage for participant 404 isolation, blocked sends, anti-spam, idempotent `clientMsgId`, and cursor pagination
2. **Phase 5 — Real-time (Socket.IO)**
3. **Phase 6 — Reports & Admin (`docs/ADMIN.md`)**
4. **Phase 7 — Hardening & docs**
