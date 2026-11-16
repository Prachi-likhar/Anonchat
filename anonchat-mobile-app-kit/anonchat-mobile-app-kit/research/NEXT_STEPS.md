# Next Steps

## Completed:
- **Phase 0 & 1:** Expo TS scaffold, NativeWind v4, design tokens, Axios `X-Client: mobile` client, secureStore refresh token rotation, in-memory auth store, navigation layouts & guards, base UI primitives.
- **Phase 2:** Complete Mobile Auth flows: Welcome, Register (strength meter, privacy helper, gender selector, rules check), Verify Email (6-box OTP, 60s cooldown, pseudonym reveal modal), Login (suspension modal, ban modal, 429 countdown, unverified redirect), Forgot & Reset password.
- **Phase 3:** Discover (debounced search, filter chips, cursor pagination, start chat), Home Dashboard (identity chip, stats, continue chatting, suggested online members, safety tips), Profile (handle copy, 12-color avatar picker, private details edit, change password, delete account, admin entry), Settings (theme, notification toggle, rules modal, logout), Blocked members list (with unblock action).
- **Phase 4:** Chat System: conversation list with unread badges, active/ended status, typing preview, delete action; active thread with inverted list, optimistic sending, delivery ticks, auto-growing composer, action menu (End, Block, Report with 30-message snapshot warning, Delete), real-time Socket.IO subscriptions.
- 44/44 tests passing across 7 test suites, `tsc` clean, `eslint` clean.

## Up Next: Phase 5 & 6 & 7 — Realtime Lifecycle, Compact Admin & Release Prep
1. **AppState Lifecycle Handling:**
   - Backgrounding socket disconnect (battery saving).
   - Foregrounding reconnect and conversation list refetch.
   - Force-logout socket event handling (session termination modal).
2. **Compact Admin Portal (`app/(admin)/`):**
   - Overview metrics (`/admin/stats`): total users, active conversations, open reports, gender distribution.
   - User directory (`/admin/users`): search, filters, user detail drawer/screen with Suspend modal (presets 24h/7d/30d/90d + reason) and Ban modal.
   - Reports triage queue (`/admin/reports`): open reports, report detail with 30-message forensic snapshot viewer, action buttons (dismiss, suspend, ban).
3. **Release Configuration & Polling:**
   - Final audit and cross-platform verification.
