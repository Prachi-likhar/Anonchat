# Next Steps

## Completed: Phase 4 — Chat (Conversations & Messages)
- [x] Socket.IO singleton client (`src/lib/socket.ts`) with in-memory auth and `useSocket` lifecycle hook
- [x] Chat state hooks: `useChatThread` with infinite message history, optimistic send, mark-as-read, and rate limit countdown
- [x] Two-pane responsive Chat page (`/app/chat/:id?`) with mobile back-navigation
- [x] ConversationList with instant search filter, unread badges, typing animation preview, and empty states
- [x] ChatHeader with partner presence, typing indicator, and dropdown actions (End, Delete, Report, Block)
- [x] MessageList with date separators, auto-scroll, earlier message pagination, and friendly greeting prompt
- [x] MessageBubble with styled bubbles, timestamps, read ticks (`✓`/`✓✓`), and strict privacy guarantee
- [x] ChatComposer with auto-expanding textarea, 2000-char counter, Enter-to-send, and ended banner
- [x] ReportModal with reason radio group, details textarea, and message snapshot notice
- [x] BlockConfirmDialog, EndChatDialog, and DeleteChatDialog
- [x] 50 passing unit and component tests across 8 test suites

## Completed: Phase 5 — Real-Time Polish & Notifications
- [x] Web Audio API oscillator synthesis chime (`src/lib/sound.ts`) with localStorage persistence and preview button
- [x] HTML5 background notifications (`src/lib/notifications.ts`) with strict privacy (zero message body disclosure)
- [x] Dynamic document title unread badge hook (`src/hooks/useTitleBadge.ts`)
- [x] Global Offline & Reconnection banner (`src/components/ui/OfflineBanner.tsx`)
- [x] Nav link unread badge bubbles on desktop sidebar and mobile bottom tab bar
- [x] Auto audio chime & notification on incoming messages from other members
- [x] Enhanced Settings with interactive "Test Chime" and permission handling
- [x] 57 passing tests across 9 Vitest suites

## Next Phase: Phase 6 — Admin Portal & Moderation
1. **Admin Dashboard (`/admin`):**
   - Live KPI stat cards (total users, active, online, reports, messages).
   - Signups trend chart (7d) & gender distribution donut.
   - Quick tables for open reports and recent audit logs.
2. **Admin Users (`/admin/users`):**
   - User directory table with search, status & gender filters, pagination.
   - User detail drawer with reports history and audit trail.
   - Moderation actions: Suspend (duration presets + reason), Ban, Reinstate.
3. **Admin Reports (`/admin/reports`):**
   - Tabs: Open, Reviewing, Resolved, Dismissed.
   - Detail view with conversation snapshot viewer.
   - Moderation actions: Dismiss, Resolve with note, Suspend, Ban.
4. **Admin Activity (`/admin/activity`):**
   - Audit stream with filters.
