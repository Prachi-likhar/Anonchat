# Decisions & Research Notes
| Date | Question / decision | Answer / reason | Source URL | Version |
|---|---|---|---|---|
| kit | Supabase replaced by Express+Postgres+Socket.IO | Required stack per owner; RLS replaced by server-side authorization (+ optional Postgres RLS) | — | — |
| 2026-11-13 | Web Stack: React 18, Vite 5, Tailwind 3.4, React Router 6, Zustand 5, TanStack Query 5 | High stability, full compatibility with design tokens, forms plugin, and Vite path aliases | vitejs.dev, tailwindcss.com | React 18.3.1, Tailwind 3.4.17 |
| 2026-11-13 | In-memory access token storage | Access token held strictly in Zustand memory state (never in localStorage/sessionStorage); refresh token in httpOnly cookie | AGENTS.md, SECURITY_PRIVACY_CHECKLIST.md | — |
| 2026-11-13 | Axios 401 refresh queue | Single in-flight `/auth/refresh` promise queues parallel requests; on failure, clears session and redirects to `/login` | AGENTS.md, BUILD_PLAN.md | — |
| 2026-11-13 | Tailwind Design Tokens & Variables | Extended theme with tokens from `DESIGN_SYSTEM.md` (bg, surface, surface-2, border, text, muted, primary, accent gradient) | DESIGN_SYSTEM.md | Tailwind 3.4 |
