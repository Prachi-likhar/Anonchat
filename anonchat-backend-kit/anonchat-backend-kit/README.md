# BACKEND KIT — Anonymous Community Chat (Node.js + Express JS + PostgreSQL)

## Quick Start
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment:**
   Copy `.env.example` to `.env` in this folder and set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_PEPPER`, `SUPER_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD`.
   - In `NODE_ENV=development`, leaving `APPS_SCRIPT_URL` empty prints OTPs to the server console (`DEV ONLY`).
3. **Run database migrations & seed super-admin:**
   ```bash
   npm run migrate
   npm run seed:admin
   ```
4. **Start the server:**
   ```bash
   npm run dev        # nodemon (development)
   npm start          # node src/server.js (production)
   ```
5. **Verify quality & tests:**
   ```bash
   npm run lint
   npm run format:check
   npm test
   npm run load:sanity
   ```

**Documentation & Kit Contents**
| Path | Purpose |
|---|---|
| `AGENTS.md` | Project brief (stack, folder layout, commands) |
| `docs/API_CONTRACT.md` + `docs/openapi.yaml` | Shared REST + Socket.IO API contract |
| `docs/ARCHITECTURE.md` | Folder structure, layers, request flow |
| `docs/DATABASE_SCHEMA.md` + `db/migrations/001_init.sql` | Tables, indexes, constraints |
| `docs/AUTH_SECURITY.md` | JWT, refresh rotation, bcrypt, CORS, rate limits, blocking rules |
| `docs/OTP_GOOGLE_SHEETS.md` + `apps-script/Code.gs` | Email OTP via Google Apps Script + Sheet log |
| `docs/REALTIME.md` | Socket.IO design |
| `docs/ADMIN.md` | Admin & moderation rules |
| `docs/DEPLOY.md` | Production deployment, Nginx WebSocket proxy, HTTPS, backups |
| `docs/TESTING.md` | Test plan |
| `docs/SECURITY_PRIVACY_CHECKLIST.md` | Security & privacy audit checklist |
| `research/` | Living memory: `PROGRESS_LOG`, `NEXT_STEPS`, `DECISIONS`, `ERRORS_LOG` |
