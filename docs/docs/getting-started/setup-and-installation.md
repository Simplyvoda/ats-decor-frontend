---
sidebar_position: 1
---

# Setup & Installation

## Prerequisites

- Node.js (matching the `engines` requirement in `fe/package.json` — Node 20+)
- A React Native CLI-capable macOS setup: Xcode + CocoaPods. **This is an iOS-only feature set** — the AR/room-scanning screens are built on Apple's ARKit/RealityKit and RoomPlan frameworks, which have no Android equivalent. `android/gradle.properties` exists and an `android` npm script is defined, but the native modules this app's core feature depends on simply aren't there on Android.

## Install dependencies

```bash
cd fe
npm install
```

Then install the iOS native dependencies (CocoaPods) — required because the native AR/scanning bridge (documented in depth in [Native Bridge Deep-Dive](/docs/native-bridge/overview-and-mental-model)) is Swift/CocoaPods-managed:

```bash
npm run ios:pods
```

If you ever need a clean slate (stale Pods, weird build cache issues), `fe/package.json` has escalating levels of clean-up:

```bash
npm run ios:clean   # wipe ios/Pods + ios/build, reinstall pods
npm run js:clean     # wipe node_modules, reinstall
npm run native:clean # also wipe Xcode DerivedData
npm run reset         # all of the above, in one shot
```

## Environment variables

Environment variables are loaded via `react-native-dotenv` (configured in `babel.config.js`, `moduleName: '@env'`, reading from a `.env` file in `fe/`). Two variables are currently used:

| Variable | Purpose |
|---|---|
| `API_URL` | Base URL the shared axios instance (`fe/src/config/api.ts`) targets for all backend requests |
| `SENTRY_DSN` | Sentry error-reporting endpoint |

Ask a teammate for the actual `.env` values, or see [Reference → Environment & Secrets](/docs/reference/environment-and-secrets) for more detail on where these get consumed. There's no `.env.example` checked into the repo at the time of writing — worth adding one.

## Next

Once dependencies and `.env` are in place, head to [Running the App](/docs/getting-started/running-the-app).
