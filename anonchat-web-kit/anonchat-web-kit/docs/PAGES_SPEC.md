# Pages Spec (all pages are fully functional — real API calls)

## 1. Landing (`/`)
Hero ("Talk freely. Stay anonymous."), how-it-works (3 steps), privacy promises, feature cards, CTA Register/Login, footer with privacy note + honest limitation text. Animated gradient background. Theme toggle. If already logged in, CTA says "Open app".

## 2. Register (`/register`)
Fields: Full name (private – helper text "Never shown to anyone"), Email, Password (strength meter), Confirm password, Gender (segmented Male/Female), checkbox "I agree to the community rules". Zod validation mirrors backend. On submit → `/auth/register` → navigate `/verify-email` with email in router state (and sessionStorage fallback for refresh). Show: "Your anonymous name will be assigned after verification" (it is generated at registration but reveal it after verify). Handle 400 field errors, 429, 503.

## 3. Verify Email (`/verify-email`)
6-box OTP input (auto-advance, paste support, numeric keyboard), resend button with 60 s countdown, error shake. On success store token+user → `/app` with welcome modal showing their new `Anonymous_xxxx` identity and privacy tips.

## 4. Login (`/login`)
Email, password (show/hide), "Forgot password?". Handle `EMAIL_NOT_VERIFIED` → redirect to verify; `ACCOUNT_SUSPENDED` → blocking card with date + reason; `ACCOUNT_BANNED`; lockout 429 → countdown. Redirect back to the originally requested route.

## 5. Forgot / Reset password
Two-step: email → OTP + new password.

## 6. Dashboard (`/app`)
Greeting with anon identity chip, quick stats (unread messages, active chats, online members count from `/members?filter=online` meta or a count), "Continue chatting" (top 3 recent conversations), "Meet someone new" (6 random/online members), safety tips card. Skeleton + empty states.

## 7. Discover (`/app/discover`)
Search by anon username (debounced 300 ms), filter chips: **All · Male · Female · Online** (URL query `?filter=`). Responsive grid of MemberCards: avatar+online dot, `Anonymous_4821`, gender badge, "Online/Offline", **Start chat** button (→ `POST /conversations` then navigate to thread; if `USER_BLOCKED` show toast). Infinite scroll/“Load more”. Realtime presence updates. Empty state ("No members match"), error state with retry.

## 8. Chat (`/app/chat/:id?`)
Left: conversation list (search, unread badge, last message preview, time, online dot, typing "typing…" preview, ended label). Right: header (avatar, anon name, online/typing status, ⋮ menu: Report, Block, End conversation, Delete conversation), message list (virtual or windowed if >500), composer (auto-grow textarea, 2000-char counter near limit, Enter to send, disabled when ended with banner "This conversation has ended"), rate-limit message with countdown. Empty thread state: "Say hi 👋 — you're talking to Anonymous_xxxx". Report modal: reason radio + details + checkbox "include recent messages" (always included; explain). Block confirm explains consequences.

## 9. My Profile (`/app/profile`)
Shows anonymous identity card (username with copy, permanent), avatar colour picker (12 swatches), editable: Full name (private), Gender; read-only: email (masked `a***@gmail.com`) and username. Save with optimistic UI + toast. Change password section. Danger zone: delete account (password confirm).

## 10. Settings (`/app/settings`)
Theme (System/Light/Dark), notification sound on/off + browser notifications permission (optional, only when tab hidden, content hidden: "New message from Anonymous_xxxx"), blocked users list with Unblock, log out, log out everywhere (optional if backend supports), links to community rules/privacy.

## 11. Admin (`/admin/*`, admin only)
- **Dashboard:** stat cards (total users, male, female, online now, new today, suspended, banned, open reports, messages today) + small charts (recharts: signups 7d, gender split donut) + recent reports + recent activity.
- **Users:** table (search, filters status/gender, pagination), columns: anon name, email, gender, status badge, online dot, reports count, joined; row actions: View, Suspend (date picker + reason), Ban (reason), Reinstate — all with ConfirmDialog and audit toast.
- **User detail:** info + reports against + audit history.
- **Reports:** tabs Open / Reviewing / Resolved / Dismissed; **Report detail:** reason, details, snapshot conversation (anon labels), actions (dismiss, resolve, suspend, ban) + note.
- **Activity:** audit log stream with filters.
Admin UI never shows full name unless backend returns it.

## 12. NotFound / Suspended-banner / Offline banner
Global offline banner when `navigator.onLine` false or socket disconnected ("Reconnecting…").
