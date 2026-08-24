---
sidebar_position: 8
---

# Walkthrough: `RoomplanView`

`RoomplanView` wraps Apple's RoomPlan framework to drive the room-scanning flow behind `ScanScreen`. Structurally it's the same shape as `RealityKitView` — a view manager plus a view class, props/commands/events — but its actual source file has a more tangled history, and this page spends more time on that history than the `RealityKitView` walkthrough did, because two genuinely broken pieces of it were found and fixed while writing this documentation. Both are shown as before/after, since seeing the wrong version is more instructive than only being told "this used to be wrong."

## Structure

Unusually, one file holds both the manager and the view class: `fe/ios/RoomPlanFeature/RoomplanViewManager.swift`.

```swift
@objc(RoomplanViewManager)
class RoomplanViewManager: RCTViewManager {
    override static func requiresMainQueueSetup() -> Bool { true }  // required for RoomPlan/ARKit

    override func view() -> UIView! {
        if #available(iOS 16.0, *) {
            return RoomplanView()
        } else {
            // fallback label for iOS < 16, where RoomPlan doesn't exist
        }
    }

    override func constantsToExport() -> [AnyHashable: Any]! {
        ["Commands": ["startScanning": "startScanning", "stopScanning": "stopScanning",
                       "resetScanning": "resetScanning", "abortScanning": "abortScanning"]]
    }

    @objc func startScanning(_ reactTag: NSNumber) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RoomplanView else { return }
            view.startScanning()
        }
    }
    // resetScanning, abortScanning, stopScanning follow the same addUIBlock pattern
}

@available(iOS 16.0, *)
@objc(RoomplanView)
class RoomplanView: UIView, RoomCaptureSessionDelegate {
    @objc var onExportComplete: RCTBubblingEventBlock?
    // ...
}
```

The export shim, `fe/ios/RoomPlanFeature/RoomplanViewManager.m`:

```objectivec
@interface RCT_EXTERN_MODULE(RoomplanViewManager, RCTViewManager)
RCT_EXTERN_METHOD(startScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(stopScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(resetScanning:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(abortScanning:(nonnull NSNumber *)reactTag)
RCT_EXPORT_VIEW_PROPERTY(onExportComplete, RCTBubblingEventBlock)
@end
```

The JS wrapper, `fe/src/components/RoomScanner/RoomPlanView.native.tsx`, follows the same pattern as `RealityKitView.native.tsx`: a typed `requireNativeComponent('RoomplanView')` plus exported command helpers (`startScanningCommand`, `stopScanningCommand`, `resetScanningCommand`, `abortScanningCommand`) that wrap the `UIManager.dispatchViewManagerCommand` boilerplate.

This is the legitimate design decision worth understanding, not a bug: `RoomplanViewManager.m` registers a class named `RoomplanViewManager` — per [page 02](/docs/native-bridge/registration-and-runtime-matching), the `Manager` suffix gets automatically stripped, so this alone is sufficient to make `requireNativeComponent('RoomplanView')` resolve correctly, with `RCTBubblingEventBlock` correctly matching what the `RoomplanView` Swift class actually declares.

## Found and fixed #0: a redundant second event and a megabyte-scale bridge payload

An earlier iteration fired **two** events for every finished scan: `onScanFinished` (metadata JSON only) and `onExportComplete` (metadata + the **entire USDZ model, base64-encoded** + file URL). Two problems:

1. **The redundant event**: both fired back-to-back at the same moment; `ScanScreen` only ever `console.log`ged `onScanFinished`. Two events for one outcome is just two contracts to keep in sync.
2. **The payload**: base64-encoding a multi-megabyte 3D model and shipping it across the RN bridge on every scan — when JS only ever read `fileUrl` and uploaded the model *as a file* from that URL — was pure overhead (bridge messages are serialized; huge payloads stall it).

There was also a subtle **error-path bug**: on export failure the event fired without `fileUrl`, and `ScanScreen` navigated to the AR viewer with `modelUrl: undefined` — a broken screen instead of an error message.

**Fix**: `onScanFinished` was removed entirely (from the Swift class, the `.m` declarations, and the JS side); `onExportComplete` now carries only `{json, fileUrl}` on success or `{error}` on failure, and `ScanScreen` checks for a missing `fileUrl` and shows an error toast instead of navigating.

## Found and fixed #1: a second, contradicting `.m` file

Until this documentation pass, a second file — `fe/ios/RoomplanView.m` — also existed, exporting the same two events with a **different, contradicting type**:

```objectivec title="RoomplanView.m (deleted)"
@interface RCT_EXTERN_REMAP_MODULE(RoomplanView, RoomplanView, UIView)
RCT_EXPORT_VIEW_PROPERTY(onScanFinished, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onExportComplete, RCTDirectEventBlock)
@end
```

Two separate `.m` files, both ultimately targeting the same runtime class name (`RoomplanView`), declaring the same two properties as **different bridge event types** (`RCTBubblingEventBlock` in one, `RCTDirectEventBlock` in the other). On top of the type conflict, `RCT_EXTERN_REMAP_MODULE`'s third argument here was `UIView` — not a sensible superclass for something meant to register as an `RCTBridgeModule`-conforming shim. Taken together, this reads as an abandoned duplicate attempt, not load-bearing code: `RoomplanViewManager.m` alone was already sufficient (see above), and nothing on the JS side depended on the second file.

**Fix**: `RoomplanView.m` was deleted, along with its build-file and group-membership entries in `fe.xcodeproj/project.pbxproj`. `RoomplanViewManager.m`'s correct `RCTBubblingEventBlock` declarations are the only ones left, matching the real Swift class.

:::danger Why this specific inconsistency matters
Having two `.m` files declare the same event property under different bridge types for what resolves to the same runtime class is exactly the kind of thing that compiles cleanly on both sides and only shows up as a real problem depending on Objective-C module load order and which registration "wins" — silent, environment-dependent breakage, not a build error. This is the sharpest illustration in this whole codebase of the tradeoff introduced on [page 02](/docs/native-bridge/registration-and-runtime-matching): runtime name-matching has no compiler to catch you when two independent declarations disagree.
:::

## Found and fixed #2: dead code with a "too aggressive" comment

`RoomplanViewManager.swift` used to have this, directly above the live implementation:

```swift title="Before (deleted)"
// func stopScanning() {
//   DispatchQueue.main.async {
//     self.cleanup()
//   }
// }

// former function was too aggressive
func stopScanning() {
    // ... the real implementation, which stops the session but keeps the view alive
}
```

A fully commented-out prior implementation, left in place, with a one-line note explaining *why* it was replaced: calling `cleanup()` (which tears down the entire `RoomCaptureView`, not just stops the session) turned out to be "too aggressive" for what `stopScanning` is supposed to do — the current implementation just calls `.stop()` on the capture session and keeps the view around, which is the correct behavior for a "stop" action as opposed to a full teardown.

**Fix**: the dead, commented-out block and its stray note were deleted, leaving just the live implementation. The comment was genuinely useful evidence of *why* a bug fix happened — worth knowing that reasoning existed — but it belongs in commit history, not as permanent dead code sitting above its own replacement.

## Kept: the delegate-nulling race-condition guards

Not a bug — a real, deliberate fix worth understanding rather than "cleaning up." `beginSession()` has an explicit ordering comment:

```swift
// ⚠️ Run FIRST, then assign delegates (prevents race)
rcv.captureSession.run(configuration: configuration)
rcv.captureSession.delegate = self
```

And `resetScanning()`/`abortScanning()` explicitly null the delegate **before** calling `.stop()`:

```swift
// Nil the delegate BEFORE stopping so a late didEndWith from the old
// session can never fire and leak stale data into onExportComplete.
self.roomCaptureView?.captureSession.delegate = nil
self.roomCaptureView?.captureSession.stop()
```

This is defending against a real async race: `RoomCaptureSessionDelegate` callbacks (like `captureSession(_:didEndWith:error:)`) can fire asynchronously, and if the delegate is still assigned when a session is torn down, a stale, late-arriving callback from the *old* session could fire after a *new* one has already started — leaking old data into `onExportComplete` for the new scan. Nulling the delegate first closes that window entirely. If you're ever modifying this file, preserve this ordering — it's not incidental.

## The room-export flow, briefly

On `captureSession(_:didEndWith:error:)`, the session's raw `CapturedRoomData` is passed through Apple's `RoomBuilder(options: [.beautifyObjects])` (smooths/cleans the mesh), exported to a `.usdz` at `Documents/savedRoom.usdz` plus a metadata JSON, then a single `onExportComplete` fires with `{json, fileUrl}`. The model itself never crosses the bridge — JS passes the `file://` URL around and uploads it as a file when the design is saved. Note the fixed filename: each new scan **overwrites** `savedRoom.usdz`; "the last scan" is a working file, and keeping a scan permanently means saving it as a design.

:::caution Since this can't be verified without running the app
Deleting `RoomplanView.m` was verified by careful reading, not by compiling and running RoomPlan on a device — that's the one part of this cleanup that needs a manual re-test of the full scan flow (start/stop/reset/abort on `ScanScreen`) before being fully trusted.
:::
