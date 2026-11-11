# Mobile Build Plan (end each phase with error-review + PROGRESS_LOG)

**Phase 0 — Scaffold:** create Expo TS app (verify command for current SDK), NativeWind, eslint/prettier, folders, `.env.example`, path alias. *Accept:* app boots on Android emulator or Expo Go; lint/typecheck pass.
**Phase 1 — Foundation:** tokens + dark/light, fonts, base UI components, API client (+ `X-Client: mobile`), secureStorage, authStore, refresh interceptor, error mapper, router groups & guards. *Accept:* theme toggle persists; guarded routes redirect.
**Phase 2 — Auth:** Welcome, Register, Verify, Login, Forgot/Reset, boot session restore. *Accept:* signup→verify→login→kill app→reopen stays logged in; logout clears secure store.
**Phase 3 — Discover/Home/Profile/Settings/Blocked.** *Accept:* filters & search work against real API; profile edit persists.
**Phase 4 — Chat:** list, thread, optimistic send, history paging, read receipts, unread badges, end/delete/block/report. *Accept:* two devices (or emulator + web) chat live with typing/presence/ticks.
**Phase 5 — Realtime & lifecycle:** AppState reconnect, NetInfo banner, force-logout, haptics, animations.
**Phase 6 — Notifications:** local notifications, badge counts; push only after backend adds token endpoint (record in DECISIONS).
**Phase 7 — Admin (compact).**
**Phase 8 — Release prep:** icons/splash, app.json (name, bundle ids, permissions minimal), EAS Build profiles, performance pass (FlashList, memoization), a11y pass, Android + iOS test matrix, `docs/DEPLOY.md` (EAS build, HTTPS API URL, store privacy declarations).
