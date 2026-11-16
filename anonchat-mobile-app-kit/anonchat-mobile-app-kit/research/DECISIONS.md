# Decisions & Research Notes
| Date | Question / decision | Answer / reason | Source URL | Version |
|---|---|---|---|---|
| kit | Supabase replaced by Express+Postgres+Socket.IO | Required stack per owner; RLS replaced by server-side authorization (+ optional Postgres RLS) | — | — |
| 2026-11-16 | Expo SDK & Router | Expo SDK ~51.0 with Expo Router ~3.5; file-based routing with route groups `(auth)`, `(app)`, `(admin)` | docs.expo.dev | Expo SDK 51 |
| 2026-11-16 | Styling Engine | NativeWind v4 with `nativewind/preset` and `withNativeWind` Metro integration for unified dark/light tailwind styling | nativewind.dev | v4 |
| 2026-11-16 | Token Storage Strategy | Access token kept strictly in memory (Zustand store); refresh token stored in `expo-secure-store` with `keychainAccessible: AFTER_FIRST_UNLOCK`. Never store tokens in AsyncStorage. | docs/ARCHITECTURE.md | — |
| 2026-11-16 | API Client & Refresh | Header `X-Client: mobile` sent on all requests. 401 response initiates single-flight token refresh with rotation of stored secure token. | docs/API_CONTRACT.md | — |
