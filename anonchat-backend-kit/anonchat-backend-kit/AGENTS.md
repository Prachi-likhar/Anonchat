# AGENTS.md — Backend

Read `.agent/rules/00-core-rules.md` first. This is the **Node.js + Express (JavaScript, CommonJS)** API + Socket.IO server.

## Stack (pin versions after checking npm via web-research)
express, pg, bcrypt (cost 12), jsonwebtoken, cors, helmet, cookie-parser, express-rate-limit, zod, socket.io, dotenv, pino + pino-http, axios (calls Apps Script), uuid; dev: nodemon, jest, supertest, eslint, prettier. Migrations: plain `.sql` files in `db/migrations` run by `scripts/migrate.js` (tracks applied files in `schema_migrations`).
Node ≥ 20. Use `"type": "commonjs"`.

## Commands (create these npm scripts)
`dev` (nodemon src/server.js) · `start` · `migrate` · `seed:admin` · `lint` · `test` · `test:watch`

## Folder layout
```
src/
  server.js            # http server + socket.io bootstrap
  app.js               # express app (middleware, routes) — exported for supertest
  config/env.js        # zod-validated env; crash on missing
  db/pool.js           # pg Pool, query helper, withTransaction
  middleware/          # auth, requireAdmin, validate, rateLimiters, errorHandler, notFound
  modules/
    auth/              # routes, controller, service, schemas (zod)
    users/             # /me
    members/           # discovery
    conversations/     # conversations + messages
    blocks/  reports/  admin/
  services/            # otpService (Apps Script), tokenService, presenceService, antiSpam
  sockets/             # index.js (auth + rooms), handlers
  utils/               # AppError, asyncHandler, anonUsername, logger
db/migrations/001_init.sql   (copy from db/schema.sql)
scripts/migrate.js  scripts/seedAdmin.js
tests/
```
Pattern: **route → validate (zod) → controller (thin) → service (business rules, SQL) → db**. Controllers never write SQL. Services never touch `req/res`.

## Env vars (`.env.example`)
```
NODE_ENV=development
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/anonchat
JWT_ACCESS_SECRET=change-me-32+bytes
JWT_REFRESH_SECRET=change-me-32+bytes-different
ACCESS_TTL=15m
REFRESH_TTL_DAYS=30
BCRYPT_COST=12
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
COOKIE_SECURE=false
APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXX/exec
APPS_SCRIPT_SECRET=long-random-shared-secret
OTP_TTL_MIN=10
OTP_PEPPER=long-random-string
SUPER_ADMIN_EMAIL=owner@example.com
SEED_ADMIN_PASSWORD=ChangeMe123
ADMIN_CAN_SEE_FULL_NAME=false
STRICT_FIRST_CONTACT=false
```
Dev fallback: if `NODE_ENV=development` and `APPS_SCRIPT_URL` is empty, print the OTP to the server console (clearly marked DEV ONLY). Never in production.
