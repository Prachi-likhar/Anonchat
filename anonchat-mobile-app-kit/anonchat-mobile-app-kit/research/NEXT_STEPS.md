# Next Steps

## Completed: Phase 0 (Scaffold) & Phase 1 (Foundation)
- Expo TS scaffold, NativeWind v4 configuration, theme tokens (dark/light).
- Secure token storage, Axios client with `X-Client: mobile`, Zustand auth store with 401 refresh rotation.
- Route navigation structure & guards (`(auth)`, `(app)`, `(admin)`).
- Complete set of UI primitives (`Button`, `TextField`, `Card`, `Avatar`, `Badge`, `SegmentedControl`, `FilterChips`, `OtpInput`, `Skeleton`, `EmptyState`, `ConfirmDialog`, `Toast`, `OfflineBanner`).
- 26/26 tests passing, TypeScript clean, ESLint clean.

## Up Next: Phase 2 — Mobile Authentication Flow
1. **Welcome Screen Polish:** connect to `register` and `login`.
2. **Register Screen:** Full Name (private helper note), Email, Password + real-time strength meter, Confirm Password, Gender SegmentedControl (Male/Female), Community Rules Agreement checkbox.
3. **Verify Email Screen:** 6-box OTP input with auto-paste, 60s resend timer countdown, assigned pseudonym reveal modal upon successful verification.
4. **Login Screen:** Email, Password, remember state, handling 403 `EMAIL_NOT_VERIFIED` (redirects to OTP), 403 `ACCOUNT_SUSPENDED` (displays modal with suspension end date and reason), 403 `ACCOUNT_BANNED` (permanent ban message), 429 rate limit countdown.
5. **Forgot / Reset Password Flow:** Step 1 (Request OTP by email) -> Step 2 (Submit 6-digit OTP + new password with strength check).
6. **Integration & Automated Testing:** Unit/integration tests for authentication screens and edge cases.
