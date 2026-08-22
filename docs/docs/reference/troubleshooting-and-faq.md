---
sidebar_position: 2
---

# Troubleshooting & FAQ

## The AR viewer doesn't seem to work in the simulator

`RealityKitView` runs in `.nonAR` mode (a virtual 3D scene renderer, not a live camera feed), so it should actually work in the simulator — see [Getting Started → Running the App](/docs/getting-started/running-the-app). `RoomplanView` (room scanning) almost certainly needs a physical LiDAR device — RoomPlan isn't simulator-testable. If something in the AR viewer specifically isn't working in a simulator, that's likely a real bug worth investigating rather than an inherent limitation.

## I changed a native prop and nothing happened

This is the single most common failure mode of the classic React Native bridge, and this codebase's native bridge uses it exclusively. See [Native Bridge → Registration & Runtime Matching](/docs/native-bridge/registration-and-runtime-matching): native prop/component names are matched **by string, at runtime**, with zero compile-time checking. If a name in the `.m` file's `RCT_EXPORT_VIEW_PROPERTY` declaration doesn't exactly match what the Swift class declares (or what the JS-side prop type expects), nothing errors — the value just silently never arrives. Double-check exact spelling across all three: the `.m` file, the Swift `@objc var`, and the JS prop type.

## I was logged out unexpectedly

Almost certainly the [401 pub/sub flow](/docs/architecture/data-flow#the-one-genuinely-cross-cutting-flow-forced-logout-on-401) — any API call anywhere in the app that gets a `401` back forces an immediate logout, not just the initial launch check. If this is happening more than expected, check whether the backend is rejecting a token that should still be valid (clock skew, token TTL misconfiguration) rather than assuming it's a frontend bug.

## Build fails after renaming or adding a native prop/command/event

Check three places, in this order:

1. The `.m` file's `RCT_EXPORT_VIEW_PROPERTY`/`RCT_EXTERN_METHOD` declaration — does the name exactly match the Swift side?
2. The Swift class's `@objc var`/`@objc func` — same question, other direction.
3. The JS-side hand-written type (e.g. `RealityKitViewProps` in `RealityKitView.native.tsx`) — this is manually maintained, not generated, so it can silently drift from the native declarations without either side erroring. See [Native Bridge → New Architecture Contrast](/docs/native-bridge/new-architecture-contrast) for why this specific failure mode exists and what would prevent it.

If the build itself is failing (not just silently not working), also check `fe/ios/fe.xcodeproj/project.pbxproj` for a stale file reference — deleting a native source file requires removing its `PBXBuildFile`/`PBXFileReference`/group/`Sources` entries too, or Xcode will look for a file that no longer exists.
