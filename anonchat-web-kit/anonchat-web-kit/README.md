# WEB KIT — Anonymous Community Chat (React + TypeScript + Tailwind CSS)

**How to use with Antigravity**
1. Unzip and open this folder as the workspace. (`.agent/` holds rules, skills, workflow.)
2. Make sure the backend kit is built/running (API at `http://localhost:4000/api`). If it isn't yet, the agent may build against `docs/API_CONTRACT.md` but must not fake data permanently.
3. Paste `FIRST_PROMPT.md`.
4. Every later prompt: agent follows `.agent/workflows/review-prompt.md`; progress is visible in `research/PROGRESS_LOG.md`.

| Path | Purpose |
|---|---|
| `AGENTS.md` | Stack, folder layout, commands, env |
| `docs/API_CONTRACT.md` | Shared contract (same in backend/mobile) |
| `docs/ARCHITECTURE.md` | Structure, state, routing, auth handling, socket client |
| `docs/DESIGN_SYSTEM.md` | Colors, typography, motion, components, dark/light mode |
| `docs/PAGES_SPEC.md` | Every page: layout, data, states, validations |
| `docs/BUILD_PLAN.md` | Phased order + acceptance criteria |
| `docs/TESTING.md` | Test plan |
| `docs/SECURITY_PRIVACY_CHECKLIST.md` | Pre-"done" checklist |
| `research/` | Living memory (progress, next steps, decisions, errors) |
