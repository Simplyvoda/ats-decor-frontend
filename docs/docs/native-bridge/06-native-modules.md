---
sidebar_position: 6
---

# Native Modules: The Non-View Case

Props, commands, and events (the last three pages) are all about a native *view* — something rendered on screen, with a react tag. `RealityKitModule` is structurally different: it's a plain `NSObject` exposing a handful of methods, called like an async API rather than attached to any rendered component.

## The export shim

```objectivec
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RealityKitModule, NSObject)
RCT_EXTERN_METHOD(openARView:(NSString *)urlString)
RCT_EXTERN_METHOD(openRoomViewer)
RCT_EXTERN_METHOD(getSavedRoomUrl:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
@end
```

Same runtime-name-matching mechanism as [page 02](/docs/native-bridge/registration-and-runtime-matching) — `RCT_EXTERN_MODULE(RealityKitModule, NSObject)` here (note: `NSObject`, not `RCTViewManager` — there's no view to manage) registers a plain native module rather than a view manager.

## Consumed from JS

```ts
import {NativeModules} from 'react-native';
const {RealityKitModule} = NativeModules;

await RealityKitModule.getSavedRoomUrl();
```

(Used in `ScanScreen.tsx` — a dev-flow shortcut that lets you jump straight to `ARViewerScreen` with the last saved room scan, instead of re-scanning every session.) `getSavedRoomUrl` is a classic promise-based bridge call: the Swift implementation takes an `RCTPromiseResolveBlock`/`RCTPromiseRejectBlock` pair and calls whichever one is appropriate, and the bridge turns that into a resolved/rejected JS `Promise`.

## Where the implementation actually lives

```swift
@objc(RealityKitModule)
class RealityKitModule: NSObject, UIDocumentPickerDelegate {
    @objc func openARView(_ urlString: NSString) { ... }
    @objc func getSavedRoomUrl(_ resolve: ..., rejecter reject: ...) { ... }
    @objc func openRoomViewer() { ... }
    // UIDocumentPickerDelegate conformance
}
```

:::note Found and fixed: a misleadingly-named file
This class used to live inside `fe/ios/RealityKitFeature/RealityKitViewController.swift` — a file that, based on its name, you'd expect to contain only a `UIViewController` subclass, but which actually held **two unrelated things**: a small dev-only `RealityKitViewController` (a thin `UIViewController` wrapping `RealityKitView` for the document-picker test flow — not used by the production RN navigation, which goes through `ARViewerScreen` instead) *and* the entire `RealityKitModule` implementation shown above. So going looking for `RealityKitModule`'s Swift implementation by filename found nothing.

**Fix**: the file was split per the normal Swift/RN convention — one exported class per file, named to match. `RealityKitModule` now lives in its own `RealityKitModule.swift` (alongside its `RealityKitModule.m` export shim), and `RealityKitViewController.swift` contains only the dev-only view controller its name promises.
:::

## `getSavedRoomUrl`'s actual behavior

Returns the `file://` URL of the last saved room scan (`Documents/savedRoom.usdz`) if it exists, or rejects with `"NO_SAVED_ROOM"` if it doesn't — a straightforward existence check via `FileManager`, no async work needed despite the promise-based signature.

## `openARView`'s dev file-picker

```swift
@objc func openARView(_ urlString: NSString) {
    #if DEBUG
    DispatchQueue.main.async {
        // ... presents a UIDocumentPickerViewController for .usdz files ...
    }
    #else
    NSLog("⚠️ RealityKitModule.openARView is a DEBUG-only dev tool — no-op in this build.")
    #endif
}
```

This lets you load a saved `.usdz` from the Files app without re-scanning a room every session. It's gated with `#if DEBUG` — compiled out of Release builds entirely, not just left in with a comment reminding a human to delete it. [Page 07](/docs/native-bridge/realitykitview-walkthrough) covers why that distinction matters: this exact code used to rely on the comment alone.
