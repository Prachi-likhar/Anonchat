# API Contract (single source of truth — identical in backend, web and mobile kits)

Base URL: `http://localhost:4000/api` (dev). JSON only. Times are ISO-8601 UTC strings. IDs are UUID strings.

## Conventions
- **Auth header:** `Authorization: Bearer <accessToken>` (access token lifetime 15 min).
- **Refresh token:** lifetime 30 days, rotated on every refresh.
  - Web: httpOnly, Secure (prod), SameSite=Lax cookie `refresh_token`, path `/api/auth`. Web sends `credentials: 'include'`.
  - Mobile: header `X-Client: mobile` → refresh token is returned in the JSON body and sent back in body `{refreshToken}`; stored in `expo-secure-store`.
- **Error shape (always):** `{ "error": { "code": "STRING_CODE", "message": "Human text", "details": {optional} } }`
- **Status codes:** 200, 201, 204, 400 `VALIDATION_ERROR`, 401 `UNAUTHENTICATED`, 403 `FORBIDDEN` / `ACCOUNT_SUSPENDED` / `ACCOUNT_BANNED` / `EMAIL_NOT_VERIFIED` / `USER_BLOCKED`, 404 `NOT_FOUND`, 409 `CONFLICT` / `CONVERSATION_ENDED`, 429 `RATE_LIMITED` / `DUPLICATE_MESSAGE` (includes `Retry-After`), 500 `INTERNAL`.
- **Pagination:** `?limit=` (default 20, max 50) and `?cursor=` (opaque string). Response: `{ "items": [...], "nextCursor": string|null }`.

## Public user object (what other users may see) — `PublicMember`
```json
{ "id": "uuid", "anonUsername": "Anonymous_4821", "gender": "male|female",
  "avatarColor": "#7C3AED", "isOnline": true, "blockedByMe": false }
```
> `id` is the user's UUID primary key (random UUIDv4, not guessable/sequential). NEVER add email/fullName/lastSeen/createdAt here.

## Own user object — `Me`
```json
{ "id":"uuid","anonUsername":"Anonymous_4821","fullName":"Real Name","email":"a@b.com",
  "gender":"male","avatarColor":"#7C3AED","role":"user|admin","theme":"system|light|dark","createdAt":"..." }
```

## Auth
| Method & path | Body | Success |
|---|---|---|
| POST `/auth/register` | `{fullName(2-60), email, password(min 8, 1 letter+1 number), gender:"male"\|"female"}` | 201 `{message, email}` — OTP emailed, account unverified |
| POST `/auth/verify-email` | `{email, otp(6 digits)}` | 200 `{accessToken, user:Me, refreshToken?(mobile)}` (+ refresh cookie on web) — verified users are logged in |
| POST `/auth/resend-otp` | `{email}` | 200 `{message}` (always 200, no account enumeration; 60 s cooldown) |
| POST `/auth/login` | `{email, password}` | 200 `{accessToken, user:Me, refreshToken?(mobile)}`; 403 `EMAIL_NOT_VERIFIED` (re-sends OTP), `ACCOUNT_SUSPENDED` (`details.until`,`details.reason`), `ACCOUNT_BANNED` |
| POST `/auth/refresh` | cookie (web) or `{refreshToken}` (mobile) | 200 `{accessToken, refreshToken?}` |
| POST `/auth/logout` | cookie/body refresh token | 204 (revokes refresh token) |
| POST `/auth/forgot-password` | `{email}` | 200 `{message}` (always) |
| POST `/auth/reset-password` | `{email, otp, newPassword}` | 200 `{message}` (revokes all refresh tokens) |

Anonymous username `Anonymous_<N>` is generated server-side at registration (random 3–5 digit number, retry on collision, widen digits when the space gets crowded). It is **permanent** and never editable.

## Me
| Method & path | Body → Result |
|---|---|
| GET `/me` | → `Me` |
| PATCH `/me` | `{fullName?, gender?, avatarColor?, theme?}` → `Me` |
| POST `/me/change-password` | `{currentPassword, newPassword}` → 204 (revokes other sessions) |
| DELETE `/me` | `{password}` → 204 (deletes account and its data) |

## Members (discovery)
`GET /members?filter=all|male|female|online&search=<partial anon username>&limit&cursor` → `{items: PublicMember[], nextCursor}`
Excludes: self, suspended/banned/unverified users, anyone who blocked me, anyone I blocked (those appear only in `/blocks`).

## Conversations & messages
```
Conversation = { id, other: PublicMember, lastMessage: {id, body, createdAt, mine:boolean}|null,
                 unreadCount:number, status:"active"|"ended", endedByMe:boolean, updatedAt }
Message = { id, conversationId, mine:boolean, body, createdAt, readAt:string|null, clientMsgId?:string }
```
| Method & path | Notes |
|---|---|
| POST `/conversations` `{memberId}` | Idempotent: returns existing active conversation or creates one. 201/200 → `Conversation`. 403 `USER_BLOCKED` if either side blocked. Limited to 10 new conversations/hour. |
| GET `/conversations?limit&cursor` | My conversations (excluding ones I deleted), newest activity first. |
| GET `/conversations/:id/messages?limit&before=<cursor>` | Newest first; 404 if I'm not a participant (never 403, so existence isn't leaked). |
| POST `/conversations/:id/messages` `{body(1-2000 chars, trimmed), clientMsgId}` | 201 `Message`. 403 `USER_BLOCKED`, 409 `CONVERSATION_ENDED`, 429 `RATE_LIMITED` / `DUPLICATE_MESSAGE`. |
| POST `/conversations/:id/read` | Marks all incoming messages read → 204; emits `message:read`. |
| POST `/conversations/:id/end` | Ends for both (no new messages) → 204; emits `conversation:ended`. History remains until deleted. |
| DELETE `/conversations/:id` | Deletes it from MY list only (soft). When both sides deleted, hard-delete messages. 204. |
| GET `/unread-count` | `{ total:number }` |

## Blocks & reports
| Method & path | Notes |
|---|---|
| POST `/blocks` `{memberId}` | 204. Also ends any active conversation. |
| DELETE `/blocks/:memberId` | 204 |
| GET `/blocks` | `{items: PublicMember[]}` (so the user can unblock) |
| POST `/reports` `{memberId, conversationId?, reason:"spam"\|"harassment"\|"inappropriate"\|"impersonation"\|"other", details?(≤500)}` | 201 `{id}`. Server stores a **snapshot of the last 30 messages** of that conversation (only if reporter is a participant). |

## Admin (role=admin only; 403 otherwise; every action written to `admin_audit_log`)
| Method & path | Notes |
|---|---|
| GET `/admin/stats` | `{totalUsers, male, female, onlineNow, newToday, new7d, suspended, banned, openReports, messagesToday, conversationsActive}` |
| GET `/admin/users?status=&gender=&q=&limit&cursor` | `AdminUser = {id, anonUsername, email, gender, status, role, isOnline, reportCount, createdAt, lastSeenAt, suspendedUntil}` (admin sees email, **never** password hash; full name hidden unless env `ADMIN_CAN_SEE_FULL_NAME=true`) |
| GET `/admin/users/:id` | AdminUser + recent reports against + audit entries |
| POST `/admin/users/:id/suspend` `{until(ISO), reason}` | 204, kills sockets/refresh tokens |
| POST `/admin/users/:id/ban` `{reason}` | 204 |
| POST `/admin/users/:id/reinstate` | 204 |
| POST `/admin/users/:id/role` `{role}` | super-admin only (env `SUPER_ADMIN_EMAIL`) |
| GET `/admin/reports?status=open\|reviewing\|resolved\|dismissed&limit&cursor` | list |
| GET `/admin/reports/:id` | report + snapshot messages (anon usernames only) |
| PATCH `/admin/reports/:id` `{status, resolutionNote?, action?:"none"\|"suspend"\|"ban"}` | 200 |
| GET `/admin/activity?limit&cursor` | audit log + recent signups/reports (no message content) |
| GET `/admin/online` | `{items: AdminUser[]}` |

Admins can NOT read arbitrary conversations — only report snapshots.

## Socket.IO (same origin as API, path `/socket.io`)
Connect: `io(URL, { auth: { token: accessToken } })`. Server verifies JWT + DB status, joins socket to room `user:<id>`, marks user online (multi-device aware via connection count), emits presence.
After a token refresh, reconnect with the new token (`socket.auth = {token}; socket.disconnect().connect()`).

| Direction | Event | Payload |
|---|---|---|
| S→C | `message:new` | `{ message: Message, conversation: Conversation }` (`mine` computed per recipient) |
| S→C | `message:read` | `{conversationId, readAt}` |
| S→C | `typing` | `{conversationId, isTyping:boolean}` |
| S→C | `presence` | `{memberId, isOnline}` (only to users who share a conversation, or are viewing discovery) |
| S→C | `conversation:ended` | `{conversationId}` |
| S→C | `force-logout` | `{reason:"suspended"\|"banned"\|"password-changed"}` |
| C→S | `typing:start` / `typing:stop` | `{conversationId}` (client throttle ≤1 per 2 s; auto-stop after 4 s) |

REST is the only path for sending messages (so validation/rate-limits live in one place); sockets deliver.

## Rate limits (HTTP 429 + `Retry-After`)
Login 10/15 min per IP+email (5 failed → 15 min lock); register 5/hour/IP; OTP resend 1/60 s & 5/hour; OTP verify 5 wrong tries → code invalidated; messages 20/min and 5/10 s burst per user; ≥3 identical bodies to same conversation in 60 s → `DUPLICATE_MESSAGE`; new conversations 10/hour; reports 10/day; global 300 req/min/IP.
