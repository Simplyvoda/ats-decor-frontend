---
sidebar_position: 2
---

# Running the App

## Metro + iOS

```bash
npm run start           # starts the Metro bundler
npm run ios:simulator    # builds and runs on an iPhone 15 simulator
npm run ios:run          # builds and runs on a connected physical device
```

`ios:simulator` and `ios:run` both invoke `react-native run-ios` under the hood (with `--simulator "iPhone 15"` or `--device` respectively) — either will also start Metro for you if it isn't already running.

:::caution AR/RoomPlan features likely need a physical device
`ScanScreen` (room scanning, via Apple's RoomPlan framework) almost certainly requires a real device with LiDAR — RoomPlan is not simulator-testable in any configuration we're aware of. `ARViewerScreen`, by contrast, uses `RealityKitView` in `.nonAR` camera mode (see [Native Bridge Deep-Dive → RealityKitView Walkthrough](/docs/native-bridge/realitykitview-walkthrough)) — a virtual 3D scene renderer, not a live camera feed — so it should actually work in the simulator. This distinction wasn't independently device-tested while writing these docs; verify against an actual device/simulator run before relying on it.
:::

## Where Sentry fits in

`@sentry/react-native` is a dependency and `SENTRY_DSN` is a configured env var (see [Setup & Installation](/docs/getting-started/setup-and-installation)), so crash/error reporting is wired up. The exact initialization point wasn't traced in depth for this documentation pass — if you're debugging why an error isn't showing up in Sentry, that's the first thing worth checking.

## Linting and tests

```bash
npm run lint   # eslint .
npm run test   # jest
```

See [Conventions & Tooling](/docs/conventions/code-style-and-linting) for what's actually configured (and, for testing specifically, an honest look at how little coverage currently exists).

## Next

[Project Structure](/docs/getting-started/project-structure) maps out where everything lives.
