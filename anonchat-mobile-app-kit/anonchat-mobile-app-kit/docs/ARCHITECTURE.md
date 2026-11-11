# Mobile Architecture

## Auth & storage
- Send header `X-Client: mobile` on every request so the backend returns `refreshToken` in JSON.
- Store `refreshToken` in `expo-secure-store` (key `refresh_token`, `keychainAccessible: AFTER_FIRST_UNLOCK`). Access token in memory (Zustand). **Never AsyncStorage for tokens.** AsyncStorage only for theme and non-sensitive UI prefs.
- Boot: show splash → read refresh token → `/auth/refresh` → `/me` → route to `(app)` or `(auth)`; failure → clear storage → `(auth)/welcome`.
- Axios interceptor: single-flight refresh on 401, rotate stored refresh token each time, logout on failure.
- Sensitive-screen privacy: set `FLAG_SECURE` on Android / hide content in app switcher (use `expo-screen-capture` `preventScreenCaptureAsync` on chat screens — log decision; makes screenshots blocked, good for anonymity).

## Navigation
Auth stack → App tabs (Home, Discover, Chats, Profile) → pushed screens (Chat thread, Settings, Blocked). Admin stack reachable from Profile only for admins. Deep link `anonchat://chat/<id>` for notification taps.

## Server state & realtime
Same pattern as web: TanStack Query cache, socket events patch the cache (`message:new`, `message:read`, `typing`, `presence`, `conversation:ended`, `force-logout`).
- Connect socket after auth; disconnect on logout.
- **AppState handling:** on `background` → disconnect socket (save battery) ; on `active` → refresh token if needed, reconnect, refetch `['conversations']` and open thread messages. Use NetInfo to show an offline banner and retry.
- Chat list uses FlashList; thread uses an **inverted** FlatList/FlashList (newest at bottom), `onEndReached` loads older with `before` cursor. Optimistic sending with `clientMsgId`; failed messages show retry tap.
- `KeyboardAvoidingView` (iOS `padding`, Android handled by `softwareKeyboardLayoutMode`) + safe-area insets. Haptic tick on send (light).
- Mark-read when thread is focused (`useFocusEffect`) and app is active.

## Notifications (Phase 6)
- Local notification when a message arrives while app is backgrounded but socket still alive; for true push the backend needs an Expo push token endpoint → **not in current contract**: propose `POST /me/push-token` in `research/DECISIONS.md` and tell the user the backend kit must add it before enabling push. Notification content must be generic: "New message from Anonymous_xxxx" (no body text on lock screen by default).
- Unread badge count on tab + app icon (`Notifications.setBadgeCountAsync`).

## Errors
`lib/errors.ts` maps contract codes to friendly messages (same table as web). Global error boundary screen with "Try again".
