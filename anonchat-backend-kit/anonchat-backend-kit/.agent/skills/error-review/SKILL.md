---
name: error-review
description: Use at the END of every task. Runs lint, type-check, tests, build and a privacy/security checklist, fixes all errors, and logs them in research/ERRORS_LOG.md.
---
# Error Review

Run in this order. Fix problems; re-run until everything is clean.

1. **Install check:** dependencies installed, no missing imports.
2. **Static checks** (whatever exists in the project): `npm run lint`, `npm run typecheck` (TS projects), `npm run build`.
3. **Tests:** `npm test`. Add tests for any new logic (auth, permissions, rate limits, blocking).
4. **Run it:** start the app/server and exercise the feature you just built (curl for API, browser/emulator for UI). Read the console/log output for warnings.
5. **Privacy/security checklist** (see `docs/SECURITY_PRIVACY_CHECKLIST.md`): grep for `email`, `full_name`, `fullName`, `password`, `token`, `otp` in anything that is sent to another user or logged.
6. **Contract check:** responses/requests match `docs/API_CONTRACT.md` field names and status codes.
7. **Log:** for each problem found append to `research/ERRORS_LOG.md`: `date | symptom | root cause | fix | how verified`.
8. Report remaining issues honestly. Never say "no errors" without having run steps 2–4.
