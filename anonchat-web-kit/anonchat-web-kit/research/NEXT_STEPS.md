# Next Steps

## Completed: Phase 5 — Real-Time Polish & Notifications
- [x] Web Audio API oscillator synthesis chime (`src/lib/sound.ts`) with localStorage persistence and preview button
- [x] HTML5 background notifications (`src/lib/notifications.ts`) with strict privacy (zero message body disclosure)
- [x] Dynamic document title unread badge hook (`src/hooks/useTitleBadge.ts`)
- [x] Global Offline & Reconnection banner (`src/components/ui/OfflineBanner.tsx`)
- [x] Nav link unread badge bubbles on desktop sidebar and mobile bottom tab bar
- [x] Auto audio chime & notification on incoming messages from other members
- [x] Enhanced Settings with interactive "Test Chime" and permission handling
- [x] 57 passing tests across 9 Vitest suites

## Completed: Phase 6 — Admin Portal & Moderation
- [x] Admin Dashboard (`/admin`): Live KPI cards, gender distribution bar, open reports and activity log previews
- [x] Admin Users (`/admin/users`): Member directory with search, gender and status filters, user detail modal with reports history, suspend modal (24h/7d/30d/90d + reason), permanent ban modal, and reinstate dialog
- [x] Admin Reports (`/admin/reports`): Tabs (Open, Reviewing, Resolved, Dismissed), detail view with 30-message conversation snapshot history viewer, and resolution actions (dismiss, resolve with note, suspend, ban)
- [x] Admin Activity (`/admin/activity`): Immutable audit log stream with action filters (suspensions, bans, reinstatements, decisions)
- [x] Strict `AdminRoute` protection (redirects non-admin users with Access Denied screen)
- [x] 63 passing tests across 10 Vitest suites

## Next Phase: Phase 7 — Quality, A11y & Deployment
1. **Responsive & A11y Audit:**
   - Audit mobile touch targets (≥44px), ARIA landmarks, keyboard navigation.
2. **Production Deployment Documentation (`docs/DEPLOY.md`):**
   - Vercel (`vercel.json` SPA routing).
   - Netlify (`public/_redirects`).
   - Nginx (`nginx.conf` with SPA fallback and WebSocket reverse proxy).
   - Backend `CORS_ORIGIN` setup.
3. **SPA Fallback Configs:**
   - Add `public/_redirects` and `vercel.json`.
4. **Final Production Build & Sanity Checks:**
   - Verify `tsc --noEmit`, `eslint`, `vitest`, and production `vite build`.
