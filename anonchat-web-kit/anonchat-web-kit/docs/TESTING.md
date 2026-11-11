# Web Testing
- **Unit (vitest):** validators (zod), error mapper, time formatting, grouping of messages, query-cache update helpers for socket events.
- **Component (Testing Library):** OTP input, MemberCard, MessageInput (Enter/Shift+Enter, char limit, disabled when ended), ConfirmDialog, filters.
- **Integration (msw):** auth interceptor refresh queue (multiple parallel 401s trigger ONE refresh), logout on refresh failure, optimistic send success/fail.
- **Privacy tests:** render MemberCard/ConversationItem with a fixture and assert no email/fullName appears in DOM; message text with `<script>` renders as text.
- **E2E smoke (playwright, optional):** register→OTP (dev console/ test hook)→discover→start chat→send→second browser receives.
- **Manual checklist:** dark/light, 360px width, keyboard-only navigation, reduced-motion, offline/online toggle, expired token mid-chat.
