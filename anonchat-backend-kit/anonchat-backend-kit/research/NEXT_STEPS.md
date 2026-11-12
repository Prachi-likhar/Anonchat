# Next Steps
Phase 0 and Phase 1 are complete. Before running `npm run migrate` or `npm run dev` locally, copy `.env.example` to `.env`, set `DATABASE_URL` to a running PostgreSQL 14+ instance, and run `npm run migrate`.

Next build phase:
1. **Phase 2 — Auth (`docs/AUTH_SECURITY.md`, `docs/OTP_GOOGLE_SHEETS.md`, `docs/API_CONTRACT.md`):**
   - `src/utils/anonUsername.js`
   - `src/services/otpService.js` (+ dev console fallback when `NODE_ENV=development` and `APPS_SCRIPT_URL` is empty)
   - `src/services/tokenService.js` (access JWT + opaque refresh rotation with `family_id` reuse detection)
   - `src/middleware/auth.js` (`authenticate` middleware loading DB status/role with short-TTL cache & explicit invalidation)
   - `src/modules/auth/` (`register`, `verify-email`, `resend-otp`, `login` with lockout & expired suspension auto-lift, `refresh`, `logout`, `forgot-password`, `reset-password`)
   - `src/modules/users/` (`GET /me`, `PATCH /me`, `POST /me/change-password`, `DELETE /me`)
   - Auth-specific rate limiters + comprehensive Jest/Supertest tests.
2. **Phase 3 — Discovery + blocks**
3. **Phase 4 — Chat REST**
4. **Phase 5 — Real-time (Socket.IO)**
5. **Phase 6 — Reports & Admin (`docs/ADMIN.md`)**
6. **Phase 7 — Hardening & docs**
