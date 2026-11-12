# Next Steps
Phase 2 (Auth & User Profile) is complete. Before running against a live DB, ensure `.env` is placed inside `anonchat-backend-kit/anonchat-backend-kit/.env` with a valid `DATABASE_URL` and run `npm.cmd run migrate`.

Next build phase:
1. **Phase 3 — Discovery + blocks (`docs/API_CONTRACT.md`, `docs/AUTH_SECURITY.md`, `docs/DATABASE_SCHEMA.md`):**
   - `toPublicMember(row)` serializer + unit test asserting exact public key set (`id`, `anonUsername`, `gender`, `avatarColor`, `isOnline`, `blockedByMe`)
   - `src/modules/members/` (`GET /api/members?filter=all|male|female|online&search=&limit=&cursor=`) excluding self, unverified/suspended/banned/admin users, and both-way blocks
   - `src/modules/blocks/` (`POST /api/blocks`, `DELETE /api/blocks/:memberId`, `GET /api/blocks`) ending active conversations in a transaction on block
   - Jest + Supertest coverage for discovery filters, privacy guarantees, and two-way blocking
2. **Phase 4 — Chat REST**
3. **Phase 5 — Real-time (Socket.IO)**
4. **Phase 6 — Reports & Admin (`docs/ADMIN.md`)**
5. **Phase 7 — Hardening & docs**
