---
description: Review a new user prompt against past work, plan, build, then error-check
---
Run this for every new prompt from the user.

1. Open and read: `research/PROGRESS_LOG.md`, `research/NEXT_STEPS.md`, `research/DECISIONS.md`, `research/ERRORS_LOG.md`.
2. Run skill `prompt-review` and write its output as a new dated entry at the top of `research/PROGRESS_LOG.md` under heading `## PLANNED — <date> — <short title>`.
3. If any fact/library/API is uncertain → run skill `web-research` first.
4. If a repeatable procedure is missing → run skill `make-skill`.
5. Implement step by step. After each step, append `DONE:` lines under the entry.
6. Run skill `error-review`. Fix every issue. Repeat until clean.
7. Update `research/NEXT_STEPS.md` with remaining work and reply with a short summary.
