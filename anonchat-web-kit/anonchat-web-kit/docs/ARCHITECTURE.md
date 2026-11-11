# Web Architecture

## Routing (React Router)
| Path | Guard | Page |
|---|---|---|
| `/` | public | Landing |
| `/register`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password` | PublicOnly (redirect to `/app` if logged in) | auth pages |
| `/app` | Protected | Dashboard |
| `/app/discover` | Protected | Discover Members |
| `/app/chat` and `/app/chat/:conversationId` | Protected | Chat (list + thread; on mobile they are separate screens) |
| `/app/profile`, `/app/settings` | Protected | Profile, Settings |
| `/admin`, `/admin/users`, `/admin/users/:id`, `/admin/reports`, `/admin/reports/:id`, `/admin/activity` | Admin (role==='admin') | Admin |
| `*` | – | NotFound |
Lazy-load admin routes and Chat (`React.lazy` + Suspense with skeleton).

## State
- **Server state:** TanStack Query. Keys: `['members', filter, search]`, `['conversations']`, `['messages', id]`, `['unread']`, `['blocks']`, `['admin', ...]`.
- **Socket events update the query cache** (not local component state): `message:new` → prepend to `['messages', id]` and update `['conversations']` order/unread; `message:read` → mark messages read; `typing` → `typingStore[conversationId]` with 4 s auto-expire; `presence` → patch `isOnline` in cached members/conversations; `conversation:ended`; `force-logout` → clear auth, toast, go to `/login`.
- **Optimistic send:** insert pending message with `clientMsgId` (uuid), show "sending…", replace on 201, show "failed – retry" on error. De-duplicate with the socket echo using `clientMsgId`/`id`.
- **Messages list:** newest at bottom, infinite scroll upward with `before` cursor, keep scroll position when loading older, auto-scroll to bottom only if user is near bottom, show "New messages ↓" pill otherwise.
- **Typing:** emit `typing:start` throttled (2 s) while typing, `typing:stop` after 3 s idle or on send.
- **Mark read:** when the thread is open and window focused (`document.visibilityState`), call `/conversations/:id/read` (debounced).
- **Unread badge:** from `GET /unread-count` + socket increments; also update `document.title` "(3) Anonymous Chat".
- **Auth bootstrap:** `AuthProvider` runs refresh→me on load; show full-screen splash until resolved to avoid flicker.
- **Error mapping:** `lib/errors.ts` maps contract codes (`USER_BLOCKED`, `RATE_LIMITED` (+Retry-After countdown), `DUPLICATE_MESSAGE`, `ACCOUNT_SUSPENDED` (show until + reason), …) to friendly messages.
- **Theme:** `themeStore` (`system|light|dark`), apply `class="dark"` on `<html>`, persist choice in localStorage (theme only — allowed), sync to `PATCH /me {theme}` when logged in.
