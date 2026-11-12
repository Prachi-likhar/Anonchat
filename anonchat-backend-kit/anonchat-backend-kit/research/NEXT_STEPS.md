# Next Steps
Phase 5 (Real-time Socket.IO) is complete.

Next build phase:
1. **Phase 6 — Reports & Admin (`docs/ADMIN.md`, `docs/API_CONTRACT.md`, `docs/TESTING.md`):**
   - `src/modules/reports/` (`POST /api/reports`, rate limit 10/day, server snapshot of last 30 messages with anon usernames only if reporter is a participant, cannot report admins)
   - `src/middleware/requireAdmin.js` (router-level `router.use(authenticate, requireAdmin)`)
   - `src/modules/admin/` (`GET /admin/stats`, `GET /admin/users`, `GET /admin/users/:id`, `POST /admin/users/:id/suspend`, `POST /admin/users/:id/ban`, `POST /admin/users/:id/reinstate`, `POST /admin/users/:id/role`, `GET /admin/reports`, `GET /admin/reports/:id`, `PATCH /admin/reports/:id`, `GET /admin/activity`, `GET /admin/online`)
   - Enforce `admin_audit_log`, prevent self-ban & banning last admin, hide `fullName` unless `ADMIN_CAN_SEE_FULL_NAME=true`, revoke tokens + emit `force-logout` on suspend/ban, and implement `scripts/seedAdmin.js`
   - Jest + Supertest tests for reports & admin (`non-admin 403`, `suspend` kills active socket + revokes tokens, stats counts, no arbitrary chat reading)
2. **Phase 7 — Hardening & docs (`docs/DEPLOY.md`, OpenAPI/Postman collection, security checklist, load sanity test)**
