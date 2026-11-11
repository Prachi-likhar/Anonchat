# BACKEND KIT — Anonymous Community Chat (Node.js + Express JS + PostgreSQL)

**How to use with Antigravity**
1. Unzip, open this folder as the workspace in Antigravity (the `.agent/` folder holds rules, skills and workflows).
2. Paste the first prompt from `FIRST_PROMPT.md`.
3. For every later prompt the agent must follow `.agent/workflows/review-prompt.md` (read `research/` → plan → build → error-review).
4. Check `research/PROGRESS_LOG.md` any time to see what was done and what's next.

**Contents**
| Path | Purpose |
|---|---|
| `AGENTS.md` | Project brief for the agent (stack, folder layout, commands) |
| `FIRST_PROMPT.md` | Copy-paste starter prompt |
| `.agent/` | Rules, skills (`prompt-review`, `error-review`, `web-research`, `make-skill`), workflow |
| `docs/API_CONTRACT.md` | Shared contract (same file in web & mobile kits) |
| `docs/ARCHITECTURE.md` | Folder structure, layers, request flow |
| `docs/DATABASE_SCHEMA.md` + `db/schema.sql` | Tables, indexes, constraints |
| `docs/AUTH_SECURITY.md` | JWT, refresh rotation, bcrypt, CORS, rate limits, blocking rules |
| `docs/OTP_GOOGLE_SHEETS.md` + `apps-script/Code.gs` | Email OTP via Google Apps Script + Sheet log |
| `docs/REALTIME.md` | Socket.IO design |
| `docs/ADMIN.md` | Admin & moderation rules |
| `docs/BUILD_PLAN.md` | Phased build order with acceptance criteria |
| `docs/TESTING.md` | Test plan |
| `docs/SECURITY_PRIVACY_CHECKLIST.md` | Pre-"done" checklist |
| `research/` | Living memory: PROGRESS_LOG, NEXT_STEPS, DECISIONS, ERRORS_LOG |
