# Errors Log
| Date | Symptom | Root cause | Fix | Verified by |
|---|---|---|---|---|
| 2026-11-12 | `prettier --check .` flagged 22 files including kit `.md` docs | `.prettierignore` did not exclude `*.md` and `package-lock.json`, and newly written `.js`/`.json` files were unformatted | Added `*.md` and `package-lock.json` to `.prettierignore` and ran `npm run format` | `npm run format:check` exited 0 |
| 2026-11-12 | `supertest` in `tests/app.test.js` failed with `connect EACCES 127.0.0.1:<port>` | Sandbox blocks loopback TCP connections on Windows | Executed `npm test` and live server smoke check with loopback access enabled | `npm test` (13/13 passed) and live `/api/health` returned 200 |
