---
name: web-research
description: Use when information is missing, a library/API version is uncertain, or an error is not understood. Searches the web, prefers official docs, and records sources in research/DECISIONS.md.
---
# Web Research

1. Write the exact question you need answered (one sentence).
2. Search the web. Prefer official docs (nodejs.org, expressjs.com, postgresql.org, socket.io, react.dev, reactnative.dev, docs.expo.dev, tailwindcss.com, nativewind.dev, developers.google.com/apps-script).
3. Check the library's current version and any breaking changes (Tailwind v3 vs v4, Expo SDK version, NativeWind v4, React Router v6/v7).
4. Prefer a tested snippet from official docs over memory.
5. Record in `research/DECISIONS.md`: question, answer, URL, date, version.
6. If sources disagree or nothing is found, say so and ask the user instead of guessing.
