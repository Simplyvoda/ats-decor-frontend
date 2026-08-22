---
sidebar_position: 7
---

# Walkthrough: `RealityKitView`

Pages 02–05 explained the four mechanisms using examples pulled from this exact component. This page is the consolidated reference — everything `RealityKitView` actually exposes, in one place, plus the pieces those earlier pages didn't have room for.

## What it is, application-wise

`RealityKitView` is a `UIView` subclass (`fe/ios/RealityKitFeature/RealityKitView.swift`) that owns a RealityKit `ARView` running in **`.nonAR` camera mode** — worth calling out explicitly, since "AR" is in the name: this is not a live camera feed with world tracking. It's a virtual 3D scene renderer that loads a previously-completed room scan (a `.usdz` file) and lets the user orbit/pan around it with gesture-driven camera controls, placing furniture into the scene. `ARViewerScreen` (RN) is the sole production consumer, embedding `RealityKitView` directly.

## Full prop/command/event inventory

| Kind | Name | Type | Covered in depth |
|---|---|---|---|
| Prop | `modelUrl` | `NSString?` | [Props](/docs/native-bridge/props) (worked example) |
| Prop (event) | `onSnapshotReady` | `RCTDirectEventBlock?` | see below |
| Prop (event) | `onFurnitureSelectionChanged` | `RCTDirectEventBlock?` | [Events](/docs/native-bridge/events) (worked example) |
| Command | `loadFurniture(urlString:)` | — | [Commands](/docs/native-bridge/commands) (worked example) |
| Command | `toggleTopView()` | — | switches the camera between orbit view and a straight-down top view |
| Command | `resetCamera()` | — | restores the initial camera position/orientation |
| Command | `captureSnapshot()` | — | see below |
| Command | `removeSelectedFurniture()` | — | deletes whichever placed piece is currently selected |

## `onSnapshotReady`, as a second events example

```swift
func captureSnapshot() {
    arView.snapshot(saveToHDR: false) { [weak self] image in
        guard let self = self else { return }
        guard let image = image, let data = image.pngData() else {
            self.onSnapshotReady?(["error": "Snapshot capture failed"])
            return
        }
        // ... writes a PNG to a temp file ...
        self.onSnapshotReady?(["path": fileURL.path])
    }
}
```

Same mechanism as `onFurnitureSelectionChanged` (invoking the block *is* sending the event), but it demonstrates something the furniture-selection example doesn't: the payload shape varies by outcome — `{path: string}` on success, `{error: string}` on failure — and the JS side (`ARViewerScreen.tsx`) discriminates between them by checking which key is present in `e.nativeEvent`. There's nothing bridge-specific about that variability; it's just an ordinary dictionary being passed across, same as any other event payload.

## Found-and-fixed: the dev-only file picker

`RealityKitModule.openARView` (which presents a document picker for loading a saved `.usdz` without re-scanning) used to be guarded only by a comment — `// DEV HELPER: comment this block out in production.` — with no actual conditional compilation enforcing it. That meant it was live in production builds unless someone remembered to manually remove it before release. It's now wrapped in `#if DEBUG ... #endif`, compiled out of Release builds entirely. Full detail on this fix is on the [Native Modules](/docs/native-bridge/native-modules) page, since that's where the code itself actually lives (inside `RealityKitViewController.swift`, despite the name — see that page for why).

This is a good general lesson, not just a one-off fix: **a comment telling a future developer "remember to do X" is not a safety mechanism.** If X is something the compiler can enforce (excluding code from a build configuration, in this case), make it do that instead of relying on human discipline at release time.
