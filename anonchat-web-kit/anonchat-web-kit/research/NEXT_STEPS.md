# Next Steps

## Completed: Phase 3 — Discover, Dashboard, Profile & Settings
- [x] MemberCard, MemberFilters, AvatarColorPicker
- [x] Discover page (`/app/discover`) with search, filter chips (All/Male/Female/Online), infinite cursor pagination, and start chat
- [x] Dashboard page (`/app`) with pseudonym identity card, live metrics, recent conversations, and recommendations
- [x] Profile page (`/app/profile`) with 12 avatar swatches, private profile editing, masked email, change password, and delete account
- [x] Settings page (`/app/settings`) with theme switcher, notification toggles, and blocked users unblock list
- [x] 36 passing unit and component tests

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

## Next Phase: Phase 5 — Real-Time Polish & Notifications
1. **Socket Reconnection & Offline Banner:**
   - Global offline notification banner when `navigator.onLine` is false or socket is disconnected ("Reconnecting...").
   - Silent auto-reconnection with backoff and state re-sync.
2. **Tab Presence & Title Badge:**
   - Browser tab document title unread counter (e.g. `(3) Anonchat`).
   - Browser notification dispatch for incoming messages when tab is hidden / backgrounded (with privacy: "New message from Anonymous_xxxx", content obscured).
   - Audio notification chime on new message (configurable in Settings).
3. **Presence Everywhere:**
   - Synchronize member presence across Discover, Dashboard, and Chat automatically.
