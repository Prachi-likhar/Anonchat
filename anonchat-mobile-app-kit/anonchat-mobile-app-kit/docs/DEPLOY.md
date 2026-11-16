# Mobile Deployment & Store Release Guide (Anonchat)

This guide provides complete instructions for building, previewing, and releasing the **Anonchat** mobile application (iOS & Android) powered by Expo SDK 51, Expo Router v3, and React Native.

---

## 1. System Architecture & Invariants

Anonchat is built with strict privacy invariants:
- **Zero Real-Identity Leakage**: Real names, real emails, and internal database UUIDs are strictly private and never visible in peer-to-peer screens or public network payloads. All peer interaction utilizes assigned pseudonyms (`Anonymous_xxxx`), avatar colors, and gender indicators.
- **Header Identification**: All HTTP and WebSocket requests dispatch `X-Client: mobile`.
- **Zero Insecure Storage**: Access tokens are kept strictly **in-memory** within the Zustand auth store (`src/store/authStore.ts`). Refresh tokens are stored exclusively in hardware-backed secure storage via `expo-secure-store`. `AsyncStorage` is never used for authentication credentials.
- **Socket Lifecycle**: WebSocket connections automatically disconnect when the application enters background or inactive states, and seamlessly reconnect and invalidate cached queries upon resuming to active foreground.

---

## 2. Environment Configuration

The mobile application reads configuration values prefixed with `EXPO_PUBLIC_` at build/bundle time:

| Environment Variable | Description | Local Dev Example | Production Example |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Base REST API endpoint | `http://10.0.2.2:5000/api/v1` | `https://api.anonchat.app/api/v1` |
| `EXPO_PUBLIC_SOCKET_URL` | Base WebSocket server | `http://10.0.2.2:5000` | `https://api.anonchat.app` |

### Platform Host Routing for Local Development:
- **Android Emulator**: Uses `http://10.0.2.2:5000` to reach the development machine's `localhost`.
- **iOS Simulator**: Uses `http://localhost:5000`.
- **Physical Device over Wi-Fi / LAN**: Replace host with your local machine's LAN IP address (e.g., `http://192.168.1.100:5000`). Both your development workstation and physical phone must be connected to the same Wi-Fi network.
- **Production / Staging**: Must use secure HTTPS (`https://...`) and TLS WebSocket (`wss://...`).

---

## 3. EAS Build Setup & Profiles

Anonchat includes pre-configured build profiles in `eas.json`:

```json
{
  "cli": {
    "version": ">= 9.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://10.0.2.2:5000/api/v1",
        "EXPO_PUBLIC_SOCKET_URL": "http://10.0.2.2:5000"
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.anonchat.example.com/api/v1",
        "EXPO_PUBLIC_SOCKET_URL": "https://api.anonchat.example.com"
      }
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.anonchat.example.com/api/v1",
        "EXPO_PUBLIC_SOCKET_URL": "https://api.anonchat.example.com"
      }
    }
  }
}
```

### Build Commands:

1. **Install EAS CLI and Login:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configure Project:**
   ```bash
   eas project:init
   ```

3. **Development Build (Expo Dev Client with custom native code):**
   ```bash
   eas build --profile development --platform android
   eas build --profile development --platform ios
   ```

4. **Internal Preview Build (Standalone APK for Android testing / Ad-Hoc iOS):**
   ```bash
   eas build --profile preview --platform android
   eas build --profile preview --platform ios
   ```

5. **Production Release Build (Google Play AAB / Apple App Store IPA):**
   ```bash
   eas build --profile production --platform all
   ```

---

## 4. App Store & Google Play Privacy Declarations

Anonchat is designed specifically to comply with the most stringent App Store and Google Play privacy standards.

### Apple App Store Privacy Nutrition Labels:
- **Data Used to Track You**: **None**. Anonchat does not track users across third-party apps or websites.
- **Data Linked to You**: **None**. Real email addresses collected during authentication are strictly for account verification, password resets, and login; they are never exposed to other users, advertisers, or third-party analytics.
- **Data Not Linked to You**:
  - *User Content*: In-app chat messages (ephemeral / peer-to-peer, anonymized by pseudonyms).
  - *Identifiers*: Random pseudonym handles (`Anonymous_xxxx`), internal random UUIDs.
  - *Diagnostics*: Crash logs and performance diagnostics (non-identifying).

### Google Play Data Safety:
- **Data Shared**: **None**. Zero user data is shared with third-party companies or organizations.
- **Data Collected**:
  - *Email Address*: Account management & security (encrypted in transit).
  - *Messages*: In-app communication between anonymous community members.
- **Security Practices**:
  - Data is encrypted in transit over HTTPS (TLS 1.3) and WSS.
  - Users can request account deletion at any time directly in the app (`Settings > Profile > Delete Account`), which permanently deletes all user profile data and terminates active sessions.
- **Device Permissions**:
  - In `app.json`, `"permissions": []` is explicitly specified for Android. Anonchat requires **zero dangerous permissions** (no Camera, no Microphone, no Contacts, no Precise/Coarse Location, no Phone State).

---

## 5. Pre-Release Verification Checklist

Prior to submitting any production build to the app stores, verify all of the following:

- [ ] **TypeScript Typecheck**:
  ```bash
  npm run typecheck
  ```
  *(Must exit with 0 errors)*

- [ ] **Linting & Code Quality**:
  ```bash
  npm run lint
  ```
  *(Must exit with 0 errors and 0 warnings)*

- [ ] **Automated Test Suite**:
  ```bash
  npm test
  ```
  *(All test suites passing)*

- [ ] **App Identity & Icons**:
  - Bundle Identifier configured in `app.json`: `com.anonchat.app`.
  - Android package name: `com.anonchat.app`.
  - Scheme: `anonchat` (for deep linking).
  - App icons and splash assets present in `./assets/`.

- [ ] **Network & Security**:
  - `EXPO_PUBLIC_API_URL` points to production HTTPS endpoint.
  - `EXPO_PUBLIC_SOCKET_URL` points to production WSS endpoint.
  - Refresh tokens properly refresh on 401 via `expo-secure-store`.
  - Socket disconnects cleanly on backgrounding and resumes cleanly on foregrounding.
