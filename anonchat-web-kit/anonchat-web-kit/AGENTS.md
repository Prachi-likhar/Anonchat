# AGENTS.md — Web (React + TypeScript)

Read `.agent/rules/00-core-rules.md` first.

## Stack (check latest stable versions via web-research; note them in DECISIONS.md)
Vite, React 18+, TypeScript (strict), Tailwind CSS (check v3 vs v4 setup instructions at tailwindcss.com), React Router, TanStack Query (server state), Zustand (auth/theme/socket UI state), axios, socket.io-client, react-hook-form + zod (+ @hookform/resolvers), framer-motion (transitions), lucide-react (icons), date-fns, clsx + tailwind-merge. Dev: eslint, prettier, vitest + @testing-library/react, msw (tests only), playwright optional.

## Commands: `dev` · `build` · `preview` · `lint` · `typecheck` (`tsc --noEmit`) · `test`

## Env (`.env.example`)
```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

## Folder layout
```
src/
  main.tsx  App.tsx
  api/            client.ts (axios + interceptors), auth.ts, members.ts, conversations.ts, blocks.ts, reports.ts, admin.ts, me.ts
  types/          api.ts  (types copied 1:1 from API_CONTRACT)
  store/          authStore.ts, themeStore.ts, presenceStore.ts
  socket/         socketClient.ts, useSocketEvents.ts
  hooks/          useMembers, useConversations, useMessages, useTyping, useDebounce
  routes/         router.tsx, ProtectedRoute.tsx, AdminRoute.tsx, PublicOnlyRoute.tsx
  layouts/        PublicLayout, AppLayout (sidebar+topbar / bottom nav on mobile), AdminLayout
  pages/          Landing, Register, VerifyEmail, Login, ForgotPassword, ResetPassword,
                  Dashboard, Discover, Chat, Profile, Settings, admin/{AdminDashboard,Users,UserDetail,Reports,ReportDetail,Activity}, NotFound
  components/
    ui/           Button, Input, Select, Card, Avatar, Badge, Modal, Toast, Skeleton, EmptyState, Spinner, ThemeToggle, ConfirmDialog
    chat/         ConversationList, ConversationItem, MessageList, MessageBubble, MessageInput, TypingIndicator, ChatHeader
    members/      MemberCard, MemberFilters
    admin/        StatCard, UsersTable, ReportCard
  lib/            cn.ts, format.ts (time), validators.ts (zod schemas), errors.ts (map error codes → messages)
```

## Hard rules for the web app
- Access token **in memory only** (Zustand, no persist). Refresh via httpOnly cookie (`withCredentials: true`). On app start call `/auth/refresh` then `/me` to restore session.
- Axios interceptor: on 401 → single in-flight refresh (queue other requests) → retry once → else logout + redirect `/login`.
- Never render another user's email/name — types make it impossible (`PublicMember` has no such fields). Render message text as plain text.
- Every data view has **loading (skeleton), empty, and error (retry) states**. Forms show field-level errors and disable submit while pending.
- Accessible: labels, focus rings, keyboard send (Enter) / newline (Shift+Enter), `aria-live` for new messages/toasts, contrast AA in both themes.
