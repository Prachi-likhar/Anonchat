# Errors Log
| Date | Symptom | Root cause | Fix | Verified by |
|---|---|---|---|---|
| 2026-11-16 | `npm install` ERESOLVE peer `react@^19` from `react-test-renderer` | React 19 published; react-test-renderer needed pinning | Added overrides `"react-test-renderer": "18.2.0"` and installed with `--legacy-peer-deps` | `npm install` completed with code 0 |
| 2026-11-16 | Jest: `SecureStore.getItemAsync` returned undefined in test | Mock did not retain values in memory | Created `jest.setup.js` with in-memory store mock | Unit tests run |
| 2026-11-16 | Jest babel hoist error: invalid variable access `secureStoreMap` | Jest forbids out-of-scope variable access in mock factory unless prefixed with `mock` | Renamed to `mockSecureStoreMap` | Jest test suite passed |
| 2026-11-16 | ESLint: couldn't find config "prettier" | `eslint-config-prettier` was referenced but uninstalled | Simplified `.eslintrc.js` to extend `["expo"]` and configured env `{ node: true, jest: true }` | `npm run lint` clean (0 errors) |
