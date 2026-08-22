---
sidebar_position: 1
slug: /intro
---

# ATS Décor Frontend Docs

This is the engineering reference for **ATS Décor** (also called "All Things Snug" internally) — a React Native app for scanning a room and placing AR furniture in it. This site covers the **frontend only** (`fe/`). The backend (`be/`, a NestJS API) isn't documented here yet — treat any backend behavior described in these pages as "what the frontend expects," not as backend documentation in its own right.

## The stack, up front

- **React Native 0.79.6**, **React 19**
- **React Navigation 7** (native-stack + bottom-tabs)
- **NativeWind 2** (Tailwind for React Native) for most screens; a handful of older screens still use plain `StyleSheet` objects
- **iOS-only native modules.** The AR/room-scanning features are built on Apple's ARKit/RealityKit and RoomPlan frameworks, which have no Android equivalent. There is no Android counterpart to the native bridge code this site documents in depth.
- **The classic ("old") React Native bridge, not Fabric/New Architecture.** This matters a lot for how the native bridge section reads — see [Native Bridge Deep-Dive → Overview](/docs/native-bridge/overview-and-mental-model) for the exact evidence.

## How this site is organized

- **[Getting Started](/docs/getting-started/setup-and-installation)** — environment setup, running the app, and a map of the project structure.
- **[Architecture](/docs/architecture/overview)** — navigation, state management, and the API/services layer: how the app is actually put together.
- **[Screens & Features](/docs/screens/overview)** — every screen and feature area, grouped and cross-referenced.
- **[Native Bridge Deep-Dive](/docs/native-bridge/overview-and-mental-model)** — the deepest, most load-bearing part of this site. A ground-up, mechanism-level explanation of how the React Native ↔ Swift bridge actually works, written for someone comfortable with React/JS but new to native iOS and the RN bridge. It also documents real bugs that existed in this exact codebase and were found and fixed while writing these docs — not just clean-room theory.
- **[Conventions & Tooling](/docs/conventions/code-style-and-linting)** — linting, TypeScript, and an honest look at the current (minimal) test coverage.
- **[Reference](/docs/reference/glossary)** — glossary, troubleshooting/FAQ, and environment variables.

:::tip Where to start if you're new to this codebase
Read Architecture first for the big picture, then Screens & Features for whatever area you're touching. Only go into the Native Bridge Deep-Dive when you actually need to modify `ScanScreen` or `ARViewerScreen`'s native code, or when you're curious how RN talks to Swift under the hood — it's a genuine deep-dive, not a quick reference.
:::
