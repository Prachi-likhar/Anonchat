# Next Steps
Phase 6 (Reports & Admin — `docs/ADMIN.md`) is complete.

Final backend phase:
1. **Phase 7 — Hardening & Docs (`docs/BUILD_PLAN.md`, `docs/SECURITY_PRIVACY_CHECKLIST.md`):**
   - Create `docs/DEPLOY.md` (env setup, Postgres migrations + `seed:admin`, reverse proxy with WebSocket `/socket.io` upgrade, HTTPS, automated DB backups)
   - Create `openapi.yaml` (full API contract spec for REST endpoints)
   - Add load sanity test script (`scripts/loadSanity.js` or `tests/` helper) for message sending
   - Verify and check off `docs/SECURITY_PRIVACY_CHECKLIST.md`
   - Run full `error-review` (`lint`, `format:check`, `test`, privacy audit) and verify clean README quick-start instructions
