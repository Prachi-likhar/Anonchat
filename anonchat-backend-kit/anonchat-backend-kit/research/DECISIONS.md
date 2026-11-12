# Decisions & Research Notes
| Date | Question / decision | Answer / reason | Source URL | Version |
|---|---|---|---|---|
| kit | Supabase replaced by Express+Postgres+Socket.IO | Required stack per owner; RLS replaced by server-side authorization (+ optional Postgres RLS) | — | — |
| 2026-11-12 | Express major version | Use Express 5 (supports Node >=18, native async rejection handling, `path-to-regexp` v8 requires named wildcards if any, `res.status().json()`). Keep `asyncHandler` helper as defensive wrapper. | https://expressjs.com/en/guide/migrating-5.html | express@5 |
| 2026-11-12 | Zod major version error handling | Zod v4 removes `ZodError.errors` in favor of `.issues`; use `err.issues` in `validate` middleware so it works cleanly on Zod v4 (and v3). | https://zod.dev/v4/changelog | zod@4 |
| 2026-11-12 | `uuid` CommonJS compatibility | `uuid` v12+ is ESM-only; pin `uuid@11` since `AGENTS.md` specifies `"type": "commonjs"`. | https://www.npmjs.com/package/uuid | uuid@11 |
| 2026-11-12 | ESLint configuration format | ESLint v9+ uses flat config `eslint.config.js` exporting an array with `@eslint/js` and `globals`. | https://eslint.org/docs/latest/use/configure/configuration-files | eslint@9+ |
| 2026-11-12 | `express-rate-limit` v8 headers & handler | Use `standardHeaders: 'draft-8'`, `legacyHeaders: false`, and custom `handler` returning contract error `{ error: { code: 'RATE_LIMITED', message } }` plus `Retry-After` header. | https://www.npmjs.com/package/express-rate-limit | express-rate-limit@8 |
| 2026-11-12 | Apps Script Web App 302 redirect & Gmail quota | Google Apps Script `ContentService` responds with an HTTP 302 redirect to `script.googleusercontent.com`; `axios.post` follows redirects automatically (`maxRedirects: 5`). Note quota cap: consumer Gmail ~100 recipients/day, Google Workspace ~1,500/day (caps daily signups/resets; plan B is swapping `otpService` for SMTP/Resend/SendGrid). | https://developers.google.com/apps-script/guides/web | Apps Script |
| 2026-11-12 | In-memory presence for v1 | `presenceService` keeps `Map<userId, connectionCount>` in memory for v1 single-instance deployment; horizontal scaling will move presence + rate limits to Redis (`@socket.io/redis-adapter`). | — | v1 |

