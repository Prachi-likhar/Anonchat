# Web Build Plan (phases in order; end each with error-review + PROGRESS_LOG)

**Phase 0 — Scaffold:** Vite React TS, Tailwind (verify current install steps), eslint/prettier, path alias `@/`, folder layout, `.env.example`. *Accept:* `npm run dev/build/lint/typecheck` pass.
**Phase 1 — Foundation:** design tokens + dark/light, `ui/` components, API client + refresh interceptor, `types/api.ts` from contract, authStore, router + guards, layouts, toasts, error mapper. *Accept:* theme toggle persists; protected routes redirect; storybook-like `/dev/ui` page (dev only) showing components.
**Phase 2 — Auth pages:** Landing, Register, Verify, Login, Forgot/Reset, session bootstrap. *Accept:* full signup→verify→login→logout against real backend; refresh on reload keeps session.
**Phase 3 — Discover + Dashboard + Profile + Settings:** members grid with filters/search/pagination, start chat, profile edit, settings, blocked list. *Accept:* filters hit API with correct params; empty/error/loading states visible.
**Phase 4 — Chat:** conversation list, thread, optimistic send, infinite scroll, read receipts, unread badges, end/delete/block/report. *Accept:* two browsers chat in real time with typing, presence and read ticks.
**Phase 5 — Real-time polish:** socket reconnection, presence everywhere, title badge, notifications, offline banner, rate-limit UX.
**Phase 6 — Admin:** all admin pages + charts. *Accept:* non-admin cannot reach `/admin` (UI guard AND API 403 handled).
**Phase 7 — Quality:** responsive audit (360/768/1280), a11y pass, Lighthouse ≥90 perf/a11y, unit/component tests, e2e smoke (register→chat), production build, `docs/DEPLOY.md` (Vercel/Netlify/Nginx, env, SPA fallback, CORS origin to add on backend).
