# Errors Log
| Date | Symptom | Root cause | Fix | Verified by |
|---|---|---|---|---|
| 2026-11-12 | `prettier --check .` flagged 22 files including kit `.md` docs | `.prettierignore` did not exclude `*.md` and `package-lock.json`, and newly written `.js`/`.json` files were unformatted | Added `*.md` and `package-lock.json` to `.prettierignore` and ran `npm run format` | `npm run format:check` exited 0 |
| 2026-11-12 | `supertest` in `tests/app.test.js` failed with `connect EACCES 127.0.0.1:<port>` | Sandbox blocks loopback TCP connections on Windows | Executed `npm test` and live server smoke check with loopback access enabled | `npm test` (13/13 passed) and live `/api/health` returned 200 |
| 2026-11-12 | `tests/otpService.test.js` threw `TypeError: Cannot redefine property: APPS_SCRIPT_URL` | `env` is `Object.freeze()`d in `src/config/env.js`, so `Object.defineProperty` cannot override it | Added optional `appsScriptUrl`/`appsScriptSecret` injection parameters on `sendOtp`/`issueAndSendOtp` | `npm test` (7 suites, 29/29 passed) |
| 2026-11-12 | `tests/sockets.test.js` timed out waiting for `presence:offline` | `handleConnection` registered `disconnect`/`typing` listeners after `await broadcastPresence(...)`, and test SQL mock matched `FROM conversations` before `AS peer_id` | Registered socket listeners synchronously before `await broadcastPresence` in `src/sockets/handlers.js` and matched `AS peer_id` first in `tests/sockets.test.js` | `npm test` (12 suites, 49/49 passed) |
| 2026-11-12 | `tests/reportsAndAdmin.test.js` failed `JSON.parse(insertArgs[5])` | `authenticate` 15s cache skipped DB call on 2nd request so `INSERT INTO reports` was at a different call index | Selected the mock call matching `INSERT INTO reports` directly instead of hardcoded call index | `npm test` (13 suites, 56/56 passed) |



