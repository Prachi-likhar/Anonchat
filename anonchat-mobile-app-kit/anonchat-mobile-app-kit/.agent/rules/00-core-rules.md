# Core Rules (always active)

You are building part of **Anonymous Community Chat** — a platform where registered community members chat one-to-one under anonymous usernames (e.g. `Anonymous_4821`). Three codebases share ONE API contract:

| Codebase | Tech |
|---|---|
| Backend | Node.js + Express (**JavaScript**), PostgreSQL, JWT, bcrypt, CORS, Socket.IO, OTP via Google Sheets/Apps Script |
| Web | React + **TypeScript**, Vite, Tailwind CSS |
| Mobile app | React Native (Expo) + **TypeScript**, NativeWind (Tailwind for RN) |

## The 6 non-negotiables
1. **Privacy first.** No API response, socket event, log line, or UI screen may ever expose another user's real name, email, or any real-world identifier. Only `anonUsername`, `gender` (as a category), `avatarColor`, and `isOnline` are public.
2. **Follow `docs/API_CONTRACT.md` exactly.** It is the single source of truth. If you must change it, change it in the doc first, log it in `research/DECISIONS.md`, and tell the user the other two codebases need the same change.
3. **Real functionality only.** No dummy data, no mocked endpoints, no static-only screens. Every button must call a real API. Every list needs loading, empty and error states.
4. **Security by default.** Validate all input (zod), parameterised SQL only, bcrypt cost 12, short-lived access tokens, never log secrets/tokens/passwords/OTPs.
5. **Work from the research log.** Follow `.agent/workflows/review-prompt.md` for EVERY user prompt (see below).
6. **Self-check before finishing.** Run the `error-review` skill at the end of every task and fix what it finds. Do not claim "done" with failing lint/type/build/tests.

## Mandatory prompt routine (every single user prompt)
1. **READ** `research/PROGRESS_LOG.md`, `research/NEXT_STEPS.md`, `research/DECISIONS.md`, `research/ERRORS_LOG.md` and skim `docs/`.
2. **REVIEW** the prompt (use skill `prompt-review`): restate it, list what is already done, what is missing, risks and ambiguities.
3. **PLAN**: write the plan into `research/NEXT_STEPS.md` and add a "PLANNED" entry in `PROGRESS_LOG.md` BEFORE writing code.
4. **LACK INFO?** Use skill `web-research` (search the web, read official docs, note sources in `research/DECISIONS.md`). Never guess an API or library signature.
5. **NEED A SKILL?** If a repeatable task has no skill, create one right then with skill `make-skill` and use it.
6. **BUILD** in small steps; after each step update `PROGRESS_LOG.md` ("DONE").
7. **CHECK ERRORS** with skill `error-review`. Fix. Re-run until clean. Log every error + fix in `research/ERRORS_LOG.md`.
8. **REPORT** to the user: what was done, what changed, what's next, anything they must do manually (keys, env vars).

## Style
- Small modular files, clear names, no giant files (>300 lines → split).
- Comments only where intent is non-obvious.
- Never commit secrets. Only `.env.example` is committed.
