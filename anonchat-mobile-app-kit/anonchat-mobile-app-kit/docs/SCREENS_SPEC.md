# Screens Spec (all functional, real API; each has loading / empty / error states)

**Welcome** — animated gradient, tagline, Register / Login buttons, privacy promise bullets.
**Register** — Full name (private helper), Email, Password (+strength), Confirm, Gender segmented, rules checkbox; zod validation; keyboard-aware scroll; submit → verify screen.
**Verify Email** — 6-cell OTP with paste, resend countdown 60 s, error shake + haptic; success → app with welcome sheet revealing `Anonymous_xxxx`.
**Login** — email/password, forgot link; handle `EMAIL_NOT_VERIFIED`, `ACCOUNT_SUSPENDED` (until + reason card), `ACCOUNT_BANNED`, 429 countdown.
**Forgot/Reset** — 2 steps (email → OTP + new password).
**Home** — identity chip, unread summary, continue chatting (3), suggested online members, safety tips.
**Discover** — search (debounced), chips All/Male/Female/Online, FlashList of MemberCards (avatar, online dot, `Anonymous_xxxx`, gender badge, Start chat), pull-to-refresh, infinite scroll, realtime presence.
**Chats** — conversation list: last message, time, unread badge, typing preview, online dot, ended label; swipe actions (Delete); search; empty state → "Find someone in Discover".
**Chat thread** — header (avatar, name, online/typing), ⋮ bottom sheet (Report, Block, End conversation, Delete), inverted message list, composer (auto-grow, 2000 limit, send button disabled when empty/ended/pending), ended banner, rate-limit countdown, "scroll to latest" pill, long-press copy. Screen capture prevention enabled.
**Profile** — identity card (username copy, permanent), avatar colour picker, editable Full name & Gender (private), masked email, change password, delete account (password), admin entry (admins only).
**Settings** — theme, notification toggles, blocked users, logout, privacy/rules links, app version.
**Blocked users** — list + Unblock.
**Admin (compact)** — Stats cards; Users list (search, filters, Suspend/Ban/Reinstate with reason & date); Reports (tabs) + detail with snapshot and actions.
**Global** — offline banner, reconnecting indicator, force-logout handling (alert + route to login), error boundary.
