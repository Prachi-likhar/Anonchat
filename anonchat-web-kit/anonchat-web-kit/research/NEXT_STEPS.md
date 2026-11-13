# Next Steps

## Completed: Phase 2 — Auth Pages & Session Bootstrap
- [x] PasswordStrength indicator component and complexity calculation
- [x] Register page (`/register`) with client validation, private name note, rules checkbox, and redirect to verify
- [x] VerifyEmail page (`/verify-email`) with 6-box OTP input, auto-advance, paste support, 60s cooldown resend timer, and Welcome Modal revealing `Anonymous_xxxx` identity
- [x] Login page (`/login`) with error handling: `EMAIL_NOT_VERIFIED` redirect, `ACCOUNT_SUSPENDED` modal, and `ACCOUNT_BANNED` banner
- [x] ForgotPassword and ResetPassword two-step recovery flow
- [x] Enhanced Landing page (`/`) with 3-step guide, persona demo, and honesty disclosure
- [x] 32 passing unit, component, and flow tests in Vitest

## Next Phase: Phase 3 — Discover, Dashboard, Profile & Settings
1. **Discover (`/app/discover`):**
   - Search by anon username (debounced 300 ms).
   - Filter chips: All · Male · Female · Online (`?filter=`).
   - Responsive grid of `MemberCard`s: avatar with online dot, `Anonymous_xxxx`, gender badge, "Online/Offline" status.
   - "Start chat" action button -> `POST /conversations` -> navigate to thread; handle `USER_BLOCKED` toast.
   - Cursor-based infinite scroll / "Load more".
   - Loading skeleton, empty state ("No members match"), error state with retry.
2. **Dashboard (`/app`):**
   - Header greeting with anonymous identity chip.
   - Quick stats cards: unread messages, active conversations, online members.
   - "Continue chatting": top 3 recent conversations.
   - "Meet someone new": 6 online/random members with instant start chat.
   - Safety tips banner.
3. **Profile (`/app/profile`):**
   - Anonymous identity card (permanent username with copy button).
   - 12-swatch avatar color picker.
   - Editable full name (private) and gender; masked email (`a***@gmail.com`).
   - Change password section.
   - Danger zone: delete account with password confirmation dialog.
4. **Settings (`/app/settings`):**
   - Theme toggle (System / Light / Dark).
   - Blocked users list with unblock action.
   - Logout and security links.
