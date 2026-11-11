# AGENTS.md — Mobile (React Native + Expo, TypeScript)

Read `.agent/rules/00-core-rules.md` first.

## Stack (verify current versions & compatibility with web-research; Expo SDK pins React Native version)
Expo (managed workflow, **Expo Router** or React Navigation — choose Expo Router; log decision), TypeScript strict, NativeWind (Tailwind for RN; check v4 requirements: tailwind v3, babel/metro config), TanStack Query, Zustand, axios, socket.io-client, react-hook-form + zod, `expo-secure-store` (tokens), `expo-notifications` (local + push, phase 6), `expo-haptics`, `react-native-reanimated` + `react-native-gesture-handler`, `@shopify/flash-list` (long lists), `lucide-react-native` + `react-native-svg`, `expo-clipboard`, `date-fns`, `@react-native-community/netinfo`, `expo-font` + `@expo-google-fonts/inter`. Dev: eslint, prettier, jest-expo + @testing-library/react-native.

Admin panel on mobile: **include a compact admin section** (stats, users, reports) visible only when `user.role==='admin'`. (Full admin experience lives in the web app.)

## Commands: `start` (expo start) · `android` · `ios` · `lint` · `typecheck` · `test`

## Env (`.env` via `EXPO_PUBLIC_` vars; `.env.example` committed)
```
EXPO_PUBLIC_API_URL=http://192.168.1.X:4000/api      # LAN IP of dev machine (NOT localhost on a real device)
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.X:4000
```
Android emulator → `http://10.0.2.2:4000`; iOS simulator → `http://localhost:4000`. Cleartext HTTP on Android dev needs `usesCleartextTraffic` (config plugin / expo-build-properties) — dev only; production must be HTTPS. Document this in `docs/DEPLOY.md`.

## Folder layout (Expo Router)
```
app/
  _layout.tsx                 # providers (Query, Theme, Auth bootstrap, Toast), splash handling
  index.tsx                   # redirect by auth state
  (auth)/ welcome.tsx register.tsx verify-email.tsx login.tsx forgot-password.tsx reset-password.tsx
  (app)/
    _layout.tsx               # tab navigator: Home, Discover, Chats(badge), Profile
    index.tsx  discover.tsx  chats.tsx  profile.tsx
    chat/[id].tsx             # thread (stack, hides tab bar)
    settings.tsx  blocked.tsx
  (admin)/ index.tsx users.tsx user/[id].tsx reports.tsx report/[id].tsx
src/
  api/ (client.ts, auth.ts, members.ts, conversations.ts, blocks.ts, reports.ts, admin.ts, me.ts)
  types/api.ts   store/ (authStore, themeStore, typingStore)   socket/ (socketClient.ts, useSocketEvents.ts)
  hooks/   components/ (ui/, chat/, members/, admin/)   lib/ (cn.ts, format.ts, validators.ts, errors.ts, secureStorage.ts)
  theme/ (tokens.ts)
```
Note: expo-router uses `app/` for routes; keep shared code in `src/`.
