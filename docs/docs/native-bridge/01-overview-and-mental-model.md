---
sidebar_position: 1
---

# Overview & Mental Model

This section explains, from the ground up, how this app's React Native JavaScript talks to native Swift code — and vice versa. It's written for someone comfortable with React/JS who has never touched native iOS development or the React Native bridge before. By the end of it you should be able to read any of the native bridge files in `fe/ios/` and know exactly what each line is doing and why.

## What actually exists

Three pieces of native code, all iOS-only (there is no Android equivalent — Apple's ARKit/RealityKit and RoomPlan frameworks simply don't exist on Android):

1. **`RealityKitView`** — the furniture-placement/AR viewer used by `ARViewerScreen`. A `UIView` subclass (`fe/ios/RealityKitFeature/RealityKitView.swift`, ~636 lines) that owns a RealityKit `ARView` running in `.nonAR` mode — a virtual 3D scene renderer, not a live camera feed. Walked through end-to-end in [page 07](/docs/native-bridge/realitykitview-walkthrough).
2. **`RoomplanView`** — the room-scanning view used by `ScanScreen`, wrapping Apple's RoomPlan framework. Walked through in [page 08](/docs/native-bridge/roomplanview-walkthrough).
3. **`RealityKitModule`** — a plain, non-view native module (no UI, just promise-based methods: `openARView`, `openRoomViewer`, `getSavedRoomUrl`). Covered in [page 06](/docs/native-bridge/native-modules).

## The single most important fact: this is the classic bridge, not Fabric

React Native has had two fundamentally different native-bridging architectures: the original ("classic," or "Paper") bridge, and the newer "New Architecture" (Fabric for views, TurboModules for native modules, both built on JSI/C++ and code-generated from a JS spec file). **This app uses the classic bridge on iOS.** That's not a guess — it's directly confirmed by:

- `fe/ios/Podfile` sets `ENV['RCT_NEW_ARCH_ENABLED'] = '0'` unconditionally, before CocoaPods installs anything.
- `fe/ios/fe/AppDelegate.swift` uses RN 0.79's newer `RCTReactNativeFactory` bootstrap shell, but the line that would actually wire up Fabric/TurboModules is commented out:
  ```swift
  //    delegate.dependencyProvider = RCTAppDependencyProvider()
  ```
- Every native file in this codebase uses classic-bridge macros exclusively — `RCT_EXTERN_MODULE`, `RCT_EXPORT_VIEW_PROPERTY`, `RCT_EXTERN_METHOD` — and there are no codegen spec files (`.d.ts` native-component specs, `codegenNativeComponent`, generated `Native*.ts` files) anywhere in the repo.

:::note Cross-platform inconsistency, worth knowing about
`fe/android/gradle.properties` has `newArchEnabled=true` — so Android is nominally configured for the New Architecture while iOS is explicitly pinned to the classic bridge. In practice this doesn't matter for the code in this section, since none of it has an Android counterpart at all, but it's worth knowing if you ever see New-Architecture-flavored Android build output alongside classic-bridge iOS code and wonder why.
:::

Everything below assumes the classic bridge. [Page 09](/docs/native-bridge/new-architecture-contrast) circles back to what would actually be different under Fabric/TurboModules, once you have the classic-bridge mental model solid.

## The three ways JS and Swift talk to each other

Every interaction between `ARViewerScreen`/`ScanScreen` and their native views reduces to one of three mechanisms:

| Mechanism | Direction | Example in this app |
|---|---|---|
| **Props** | JS → native | Setting `modelUrl` on `<RealityKitNativeView>` |
| **Commands** | JS → native | Calling `loadFurnitureCommand(ref, url)` |
| **Events** | native → JS | `onFurnitureSelectionChanged` firing when the user taps a piece of furniture |

[Page 03](/docs/native-bridge/props), [04](/docs/native-bridge/commands), and [05](/docs/native-bridge/events) cover each in detail, with exact hop-by-hop mechanics. But all three of them depend on one prior fact, covered in [page 02](/docs/native-bridge/registration-and-runtime-matching): **how does the bridge even know a Swift class named `RealityKitView` exists, and how does it find it?** That's the concept that unlocks everything else, so it comes first.
