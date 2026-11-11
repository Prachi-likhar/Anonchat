---
name: prompt-review
description: Use at the start of every user prompt. Reviews the prompt against the research/ and docs/ folders, states what was already done, what is left, risks, and produces a plan before any code is written.
---
# Prompt Review

## Steps
1. Read `research/PROGRESS_LOG.md`, `research/NEXT_STEPS.md`, `research/DECISIONS.md`, `research/ERRORS_LOG.md`, then the relevant `docs/*.md`.
2. Write (in `PROGRESS_LOG.md`) a block with exactly these headings:
   - **Prompt (my words):** one-paragraph restatement.
   - **Already done:** bullets, with file paths.
   - **To do now:** ordered, small, verifiable steps.
   - **Not in scope / later:** bullets.
   - **Risks & ambiguities:** privacy leaks, contract changes, missing env vars, unknown libs.
   - **Info I lack → will research:** bullets (feeds `web-research`).
   - **Skills needed:** existing or to-be-made.
3. If the prompt conflicts with `docs/API_CONTRACT.md` or a privacy rule, STOP and tell the user before coding.
4. Do not start coding until the block is written.
