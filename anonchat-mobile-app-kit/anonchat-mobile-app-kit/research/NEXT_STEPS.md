# Next Steps

## Completed:
- **Phase 0 & 1:** Expo TS scaffold, NativeWind v4, design tokens, Axios `X-Client: mobile` client, secureStore refresh token rotation, in-memory auth store, navigation layouts & guards, base UI primitives.
- **Phase 2:** Complete Mobile Auth flows: Welcome, Register (strength meter, privacy helper, gender selector, rules check), Verify Email (6-box OTP, 60s cooldown, pseudonym reveal modal), Login (suspension modal, ban modal, 429 countdown, unverified redirect), Forgot & Reset password.
- 29/29 tests passing across 5 test suites, `tsc` clean, `eslint` clean.

## Up Next: Phase 3 — Discover, Home Dashboard, Profile & Settings
1. **Home Dashboard (`app/(app)/index.tsx`):**
   - Identity banner chip showing `Anonymous_xxxx` and avatar swatch.
   - Unread summary metrics.
   - Continue chatting quick list (top 3 recent active conversations).
   - Suggested online members carousel/list.
   - Community safety tips.
2. **Discover Screen (`app/(app)/discover.tsx`):**
   - Debounced search bar (matching `Anonymous_xxxx` handles).
   - Filter chips: `All`, `Male`, `Female`, `Online`.
   - Member card list with avatar, online indicator dot, anon username, gender badge, "Start Chat" button.
   - Pull-to-refresh & pagination cursor support.
3. **Profile Screen (`app/(app)/profile.tsx`):**
   - Permanent anonymous handle copy chip.
   - 12-color avatar palette picker with live `PATCH /me { avatarColor }`.
   - Masked email (`a******z@domain.com`).
   - Change password sheet / modal.
   - Delete account dialog (requires password confirmation).
   - Admin badge & portal entry (visible only when `user.role === 'admin'`).
4. **Settings Screen (`app/(app)/settings.tsx`) & Blocked List (`app/(app)/blocked.tsx`):**
   - Theme toggle (System / Light / Dark) synced with backend and AsyncStorage.
   - Blocked members list with "Unblock" action calling `DELETE /blocks/:memberId`.
   - App version and privacy rules modal.
