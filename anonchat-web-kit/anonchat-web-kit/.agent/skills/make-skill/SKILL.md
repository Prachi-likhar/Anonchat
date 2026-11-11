---
name: make-skill
description: Use when a repeatable task has no skill yet. Creates a new skill folder with a valid SKILL.md on the spot and then uses it.
---
# Make a Skill

1. Create folder `.agent/skills/<kebab-name>/` and file `SKILL.md`.
2. File starts with front-matter:
   ```
   ---
   name: <kebab-name>
   description: <when to use it + what it does, one or two sentences>
   ---
   ```
3. Body: numbered steps, exact commands, file paths, a done-checklist. Keep it under 80 lines. Put big reference material in sibling files.
4. Log the new skill in `research/DECISIONS.md`.
5. Immediately use it on the current task, then improve it if it was awkward.
