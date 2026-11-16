# Next Steps

## Completed:
- **Phase 0 & 1:** Expo TS scaffold, NativeWind v4, design tokens, Axios `X-Client: mobile` client, secureStore refresh token rotation, in-memory auth store, navigation layouts & guards, base UI primitives.
- **Phase 2:** Complete Mobile Auth flows: Welcome, Register (strength meter, privacy helper, gender selector, rules check), Verify Email (6-box OTP, 60s cooldown, pseudonym reveal modal), Login (suspension modal, ban modal, 429 countdown, unverified redirect), Forgot & Reset password.
- **Phase 3:** Discover (debounced search, filter chips, cursor pagination, start chat), Home Dashboard (identity chip, stats, continue chatting, suggested online members, safety tips), Profile (handle copy, 12-color avatar picker, private details edit, change password, delete account, admin entry), Settings (theme, notification toggle, rules modal, logout), Blocked members list (with unblock action).
- 36/36 tests passing across 6 test suites, `tsc` clean, `eslint` clean.

## Up Next: Phase 4 — Chat System & Realtime Messaging
1. **Conversation List Screen (`app/(app)/chats.tsx`):**
   - Active and ended conversations.
   - Last message preview, timestamp formatted with `formatTimeAgo`.
   - Unread badge counter.
   - Online presence dot on avatar.
   - Swipe or button to delete conversation from user's list (`DELETE /conversations/:id`).
   - Empty state redirecting to Discover.
2. **Active Chat Thread Screen (`app/(app)/chat/[id].tsx`):**
   - Header with avatar, `Anonymous_xxxx`, online indicator, and menu button (⋮).
   - Inverted FlatList for messages with cursor pagination (`before` cursor).
   - Bubble styling: own messages on right with primary gradient, other's on left in surface-2.
   - Status indicators: read receipts (`✓` sent, `✓✓` read), optimistic delivery pending state.
   - Message Composer: auto-growing input, 2000-character limit counter, send button disabled when empty/ended.
   - Action sheet / menu modal: End conversation (`POST /conversations/:id/end`), Block user (`POST /blocks`), Report user with 30-message snapshot warning notice (`POST /reports`), Delete conversation (`DELETE /conversations/:id`).
   - Sensitive screen capture prevention (`expo-screen-capture` on mount, released on unmount).
   - Mark as read on thread focus (`POST /conversations/:id/read`).
3. **Socket.IO Real-time Integration (`src/socket/socketClient.ts`):**
   - Connection lifecycle with in-memory JWT token.
   - Real-time events: `message:new`, `message:read`, `typing`, `presence`, `conversation:ended`, `force-logout`.
   - Automatic reconnect on token refresh.
