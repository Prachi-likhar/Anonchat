# Project Context — Anonymous Community Chat (`Anonchat`)

> Living handoff/context summary of completed work, architecture decisions, verification status, and active next steps.

## Repository Layout
- **Backend (`anonchat-backend-kit/anonchat-backend-kit/`):** Complete Node.js + Express (v5, CommonJS) + PostgreSQL + Socket.IO API server (Phases 0–7 completed, tested, and pushed).
- **Web (`anonchat-web-kit/anonchat-web-kit/`):** React 18 + TypeScript + Vite + Tailwind CSS frontend application (Phases 0–1 completed and tested).
- **Mobile (`anonchat-mobile-app-kit/anonchat-mobile-app-kit/`):** React Native (Expo) + TypeScript + NativeWind starter kit (ready for implementation against the backend API contract).

## Web Frontend Completed Work (Phases 0–7 — 100% Complete)

### Phase 0 & Phase 1 — Scaffold & Foundation
- Initialized React 18 + TypeScript (strict) + Vite 5 + Tailwind CSS 3.4 with path aliases (`@/*`).
- Configured design tokens in `tailwind.config.js` and `src/index.css` (`bg`, `surface`, `surface-2`, `border`, `text`, `muted`, `primary`, `accent-gradient`, `online`, `gender`).
- Installed `@rollup/wasm-node` fallback with `scripts/patchRollup.js` and npm `postinstall` hook to guarantee seamless builds under Windows Application Control / AppLocker environments.
- Implemented `src/types/api.ts` directly adhering 1:1 to `docs/API_CONTRACT.md`.
- Implemented `src/lib/` utilities: `cn.ts` (twMerge), `errors.ts` (API error code mapper), `format.ts` (date, time, anon initials, masked email), `validators.ts` (Zod schemas matching backend).
- Implemented state stores:
  - `themeStore.ts`: `system|light|dark` with localStorage persistence and automatic OS preference sync.
  - `authStore.ts`: in-memory access token storage (never localStorage), user state, auth flags, silent refresh bootstrap.
  - `toastStore.ts`: global accessible toast notification queue.
- Implemented `src/api/client.ts`: Axios client configured with `withCredentials: true`, access token header injection, and single in-flight 401 refresh queue against `/auth/refresh`.
- Implemented API modules: `auth.ts`, `me.ts`, `members.ts`, `conversations.ts`, `blocks.ts`, `reports.ts`, `admin.ts`.
- Implemented UI primitives in `src/components/ui/`: `Button`, `Input`, `Select`, `SegmentedControl`, `Card`, `Avatar`, `Badge`, `GenderBadge`, `Modal`, `ConfirmDialog`, `Toast`, `ToastContainer`, `Skeleton`, `EmptyState`, `Spinner`, `ThemeToggle`.
- Implemented layouts and route guards: `PublicLayout`, `AppLayout` (with desktop left rail, mobile bottom bar, header), `AdminLayout`, `ProtectedRoute`, `AdminRoute`, `PublicOnlyRoute`, `NotFound`.
- Implemented `/dev/ui` design system gallery showcasing all component variants, themes, and states.

### Phase 2 — Auth Pages & Session Bootstrap
- Implemented `PasswordStrength` indicator component with complexity scoring.
- Implemented `Register` page (`/register`): full name with privacy indicator, email, password strength meter, confirm password, gender segmented control, and community rules agreement.
- Implemented `VerifyEmail` page (`/verify-email`): 6-box OTP input with auto-advance, backspace navigation, paste support, 60s cooldown resend timer, error shake, and celebration Welcome Modal revealing assigned `Anonymous_xxxx` pseudonym and privacy charter.
- Implemented `Login` page (`/login`): email/password authentication, automatic redirection on `EMAIL_NOT_VERIFIED`, modal for `ACCOUNT_SUSPENDED` (displaying reason and expiration timestamp), banner for `ACCOUNT_BANNED`, and redirect-back support.
- Implemented `ForgotPassword` (`/forgot-password`) and `ResetPassword` (`/reset-password`) two-step password recovery.
- Enhanced `Landing` page (`/`): animated hero, how-it-works 3-step guide, live pseudonym preview, and community limitation transparency note.
- Code-splitting with Rollup manual chunks keeping all production bundles under 260 kB.
- Verification passed: `npm run typecheck` clean, `npm run lint` clean, `npm run format:check` clean, `npm run build` passes, `npm test` (32/32 tests passed across 6 test suites).

### Phase 3 — Discover, Dashboard, Profile & Settings
- Implemented `useDebounce`, `useMembers` (`useInfiniteQuery` with search and filters), and `useConversations` hooks.
- Implemented `MemberCard` (avatar, presence, pseudonym, gender badge, "Start Chat"), `MemberFilters` (search input, clear button, filter chips), and `AvatarColorPicker` (12 preset color swatches).
- Implemented `Discover` page (`/app/discover`): filter chips (`All`, `Online`, `Male`, `Female`), URL query sync, debounced search, responsive grid, empty/error/skeleton states, and start conversation handling.
- Implemented `Dashboard` page (`/app`): anonymous identity card with copy button, live metrics cards, "Continue Chatting" with unread badges, "Meet Someone New" member suggestions, and safety tips.
- Implemented `Profile` page (`/app/profile`): permanent pseudonym display, 12-swatch avatar color picker, editable private full name and gender, masked email, change password form, and Danger Zone delete account modal.
- Implemented `Settings` page (`/app/settings`): theme switcher, notification sound and browser notification toggles, blocked users list with unblock button, and logout actions.
- Verification passed: 36/36 tests passed in Vitest, `tsc --noEmit` clean, `eslint` clean, and production bundle built successfully.

### Phase 4 — Chat (Conversations & Messages)
- Implemented Socket.IO integration (`src/lib/socket.ts` and `src/hooks/useSocket.ts`) with in-memory auth, auto-reconnection, typing emitters, and presence sync.
- Implemented `src/hooks/useChatThread.ts`: infinite message history query, optimistic sending with rollback, real-time message read receipts, typing indicator auto-reset, and rate-limit countdown.
- Implemented `src/components/chat/`: `ConversationItem`, `ConversationList`, `ChatHeader`, `MessageBubble`, `MessageList`, `ChatComposer`, `ReportModal`, and `ChatDialogs` (`BlockConfirmDialog`, `EndChatDialog`, `DeleteChatDialog`).
- Implemented `Chat` page (`/app/chat/:id?`): responsive two-pane layout, search filtering, message date separators, unread counters, and mobile back navigation.
- Verification passed: 50/50 tests passed across 8 Vitest suites, `tsc --noEmit` clean, `eslint` clean, and production bundle built successfully.

### Phase 5 — Real-Time Polish & Notifications
- Implemented `src/lib/sound.ts`: synthesized Web Audio chime for incoming messages, localStorage persistence, and interactive preview button.
- Implemented `src/lib/notifications.ts`: background HTML5 push notifications with strict privacy (zero message body disclosure, active only when tab is hidden).
- Implemented `src/hooks/useTitleBadge.ts`: reactive browser tab unread count badge.
- Implemented `src/components/ui/OfflineBanner.tsx`: global offline/reconnecting alert banner.
- Integrated unread count badges on desktop navigation sidebar and mobile bottom tab bar in `AppLayout.tsx`.
- Verification passed: 57/57 tests passed across 9 Vitest suites, `tsc --noEmit` clean, `eslint` clean, and production bundle built successfully.

### Phase 6 — Admin Portal & Moderation
- Implemented `AdminDashboard.tsx`: KPI cards, online/active chat stats, gender demographic progress bar, open reports preview, and moderation activity summary.
- Implemented `AdminUsers.tsx`: User directory with search, gender & status filters, user detail modal, duration-preset suspension dialog, permanent ban dialog, and reinstate action.
- Implemented `AdminReports.tsx`: Triage tabs (Open, In Review, Resolved, Dismissed), report detail drawer with attached 30-message conversation snapshot history viewer, and resolution actions (dismiss, resolve, suspend, ban).
- Implemented `AdminActivity.tsx`: Immutable audit log stream with action filters (suspensions, bans, reinstatements, report decisions).
- Verification passed: 63/63 tests passed across 10 Vitest suites, `tsc --noEmit` clean, `eslint` clean, and production bundle built successfully.

### Phase 7 — Quality, A11y & Deployment Documentation
- Authored production deployment guide `docs/DEPLOY.md`: covers Vercel edge deployment, Netlify static hosting, Linux Nginx reverse proxy with gzip & WebSocket upgrade headers, multi-stage Dockerfile, and backend `CORS_ORIGINS` setup.
- Implemented SPA routing fallbacks: `public/_redirects` and `vercel.json`.
- Enhanced `index.html` with production meta tags, responsive viewport, theme color, and description.
- Conducted responsive and accessibility audit across desktop, tablet, and mobile breakpoints.
- Verification passed: All 63 tests passing across 10 Vitest suites, `tsc --noEmit` clean, `eslint` clean, and production bundle built successfully.

## Backend Completed Work (Phases 0–7)

### Phase 0 & Phase 1 — Scaffold & Foundation (`623ddf9`)
- CommonJS package setup (Node `>=20`), pinned dependencies, ESLint v9 flat config, Prettier, Jest + Supertest.
- Zod-validated environment config (`src/config/env.js`), `pino` redaction logger (`src/utils/logger.js`).
- PostgreSQL pool & transactions (`src/db/pool.js`), migration runner (`scripts/migrate.js`, `db/migrations/001_init.sql`).
- Foundation middleware: `AppError`, `asyncHandler`, `validate` (Zod v4 issues), `notFound`, `errorHandler` (contract error shape), `globalLimiter`, `app.js`, `server.js`, `GET /api/health`.

### Phase 2 — Auth & User Profile (`03ab9fe`)
- `src/utils/anonUsername.js`: Generates `Anonymous_<N>` (`[100, 9999]`), retries `23505` collisions, widens range ×10.
- `src/services/otpService.js`: 6-digit OTP, `sha256` peppered hash, `timingSafeEqual`, 5-attempt invalidation, Apps Script Web App delivery with `503` rollback, development console fallback.
- `src/services/tokenService.js`: HS256 access JWT, 48-byte opaque refresh token stored as SHA-256 with `family_id` rotation and reuse theft detection.
- `src/middleware/auth.js`: Bearer JWT + live DB account status check with 15 s cache and expired suspension auto-lift.
- Endpoints: `/api/auth/*` (`register`, `verify-email`, `resend-otp`, `login` with 5-fail 15-min lockout, `refresh`, `logout`, `forgot-password`, `reset-password`) with web `httpOnly` cookie vs `X-Client: mobile` body support; `/api/me/*` (`GET`, `PATCH`, `change-password`, `DELETE`).

### Phase 3 — Discovery & Blocks (`f0dc07b`)
- `src/services/presenceService.js`: In-memory multi-device connection map.
- `src/utils/pagination.js`: `escapeLike` (`%`, `_`, `\`), opaque base64url cursors, `slicePage`.
- `toPublicMember`: Serializer with strict public keys (`id`, `anonUsername`, `gender`, `avatarColor`, `isOnline`, `blockedByMe`).
- Endpoints: `GET /api/members` (filters `all|male|female|online`, search, pagination, exclusions), `/api/blocks/*` (transactional block + end active conversation, unblock, list).

### Phase 4 — Chat REST & Anti-Spam (`c045302`)
- `src/services/antiSpam.js`: 5 messages / 10 s burst, 20 messages / 60 s, 10 new conversations / hour, normalized body hash duplicate detection (`>= 3` identical in 60 s -> `429 DUPLICATE_MESSAGE`), `STRICT_FIRST_CONTACT`.
- Endpoints: `POST /api/conversations` (idempotent active reuse `200` / create or reactivate `201`, `403 USER_BLOCKED`), `GET /api/conversations` (cursor pagination), `GET /api/conversations/:id/messages` (newest first, `before` cursor, 404 for non-participants), `POST /api/conversations/:id/messages` (1–2000 chars trimmed, idempotent `clientMsgId`, `409 CONVERSATION_ENDED`), `POST /read`, `POST /end`, `DELETE` (soft-delete; hard-deletes messages when both sides deleted), `GET /api/unread-count`.

### Phase 5 — Real-time Socket.IO (`4d3fd16`)
- `src/sockets/index.js`: Socket.IO attached to HTTP server (`/socket.io`, websocket + polling, CORS allow-list), JWT + DB account status authentication.
- `src/sockets/handlers.js`: `user:<id>` rooms, JWT expiry disconnect timer, multi-device presence, disconnect `last_seen_at` update, presence broadcasts only to conversation peers, throttled `typing:start`/`typing:stop` relay for non-blocked participants.
- `src/sockets/emitter.js`: Emitters wired to REST actions (`message:new`, `message:read`, `conversation:ended`, `force-logout`).

### Phase 6 — Reports & Admin Moderation (`f93d8de`)
- `src/modules/reports/`: `POST /api/reports` with 10/day user rate limit, rejecting self-reporting & admin-reporting, storing last-30-message snapshot with anon usernames only.
- `src/middleware/requireAdmin.js`: `role === 'admin'` guard (`403 FORBIDDEN`).
- `src/modules/admin/`: `GET /stats`, `GET /users`, `GET /users/:id`, `POST /users/:id/suspend`, `POST /users/:id/ban`, `POST /users/:id/reinstate`, `POST /users/:id/role` (`SUPER_ADMIN_EMAIL`-only), `GET /reports`, `GET /reports/:id` (snapshot with `Reporter`/`Reported` labels), `PATCH /reports/:id` (atomic workflow + suspend/ban), `GET /activity`, `GET /online`.
- Auditing: `admin_audit_log` writes on all actions, self-ban and last-admin guards, token revocation + socket `force-logout`.
- `scripts/seedAdmin.js`: Seeds `Anonymous_Admin` from `SUPER_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### Phase 7 — Hardening & Docs
- `docs/DEPLOY.md`: Production deployment guide (Node 20, PostgreSQL 14+, Nginx reverse proxy with WebSocket upgrade, HTTPS, backups, Redis scaling path).
- `docs/openapi.yaml`: Full OpenAPI 3.0.3 specification matching `docs/API_CONTRACT.md`.
- `scripts/loadSanity.js`: Message-sending burst load sanity runner (`npm run load:sanity`) verifying 5-burst limit + 25 rate-limited requests at sub-5ms latencies.
- `docs/SECURITY_PRIVACY_CHECKLIST.md` and updated `README.md`.
