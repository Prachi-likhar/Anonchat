# Next Steps

## Completed: Phase 0 & Phase 1 — Web Scaffold & Foundation
- [x] Project scaffold with Vite + React 18 + TypeScript + Tailwind CSS
- [x] Design tokens configured (`bg`, `surface`, `border`, `text`, `muted`, `primary`, `accent-gradient`, `online`, `gender`)
- [x] API client (`src/api/client.ts`) with access token injection and single in-flight 401 refresh queue
- [x] API endpoints (`auth.ts`, `me.ts`, `members.ts`, `conversations.ts`, `blocks.ts`, `reports.ts`, `admin.ts`)
- [x] Types 1:1 with contract (`src/types/api.ts`)
- [x] Stores: `themeStore.ts` (persisted), `authStore.ts` (in-memory access token), `toastStore.ts`
- [x] UI primitives: `Button`, `Input`, `Select`, `SegmentedControl`, `Card`, `Avatar`, `Badge`, `GenderBadge`, `Modal`, `ConfirmDialog`, `Toast`, `Skeleton`, `EmptyState`, `Spinner`, `ThemeToggle`
- [x] Layouts & Guards: `PublicLayout`, `AppLayout`, `AdminLayout`, `ProtectedRoute`, `AdminRoute`, `PublicOnlyRoute`, `NotFound`
- [x] Storybook-like `/dev/ui` design system showcase
- [x] 23 Unit, component, and privacy tests passing in Vitest

## Next Phase: Phase 2 — Auth Pages & Session Bootstrap
1. Build `Register` page (`/register`):
   - Full name (private indicator), Email, Password with strength indicator, Confirm password.
   - Gender segmented control (Male / Female).
   - "I agree to the community rules" checkbox.
   - Zod client-side validation mirroring backend.
   - Handle 400 validation errors, 429 rate limit, 503 service unavailable.
2. Build `VerifyEmail` page (`/verify-email`):
   - 6-box OTP input with auto-advance, paste handling, numeric keyboard.
   - Resend OTP button with 60-second cooldown timer.
   - Welcome modal showing assigned `Anonymous_xxxx` identity and community privacy guidelines upon successful verification.
3. Build `Login` page (`/login`):
   - Email, password (show/hide), "Forgot password?" link.
   - Error handling: `EMAIL_NOT_VERIFIED` -> redirect to `/verify-email`, `ACCOUNT_SUSPENDED` -> modal/card with expiry date and reason, `ACCOUNT_BANNED` -> permanent ban notice, 429 lockout countdown.
   - Redirect to originally requested route on success.
4. Build `ForgotPassword` and `ResetPassword` pages:
   - Request reset OTP -> enter OTP + new password.
5. End-to-end test against local backend auth endpoints.
