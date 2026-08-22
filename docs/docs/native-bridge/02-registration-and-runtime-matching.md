---
sidebar_position: 2
---

# Registration & Runtime Matching

This is the single most important page in this section. Once this clicks, props/commands/events (the next three pages) are just "and here's what gets attached once the pieces below already know how to find each other."

## What `requireNativeComponent` actually returns

On the JS side, `fe/src/components/RoomScanner/RealityKitView.native.tsx` does this:

```tsx
const RealityKitNativeView = requireNativeComponent<RealityKitViewProps>('RealityKitView');
```

`requireNativeComponent('RealityKitView')` does **not** return anything resembling a normal React component backed by JS render logic. It returns an opaque handle — under the hood, rendering it creates a native view via the bridge and gets back a numeric **react tag** identifying that specific view instance. The string `'RealityKitView'` is a lookup key: at some point, the native side has to have registered *something* under that exact name for this to resolve to a real, working view. `UIManager.getViewManagerConfig('RealityKitView')` (used by the command dispatchers, see [page 04](/docs/native-bridge/commands)) is how JS later asks "what props/commands does the thing registered under this name support?" — that config is built from whatever the native side exported.

So the real question is: **how does a name like `'RealityKitView'` get connected to an actual Swift class?**

## `RCT_EXTERN_MODULE`: registration by runtime string matching, not compile-time linkage

Here's the ObjC export shim for the `RealityKitView` manager, in full (`fe/ios/RealityKitFeature/RealityKitViewManager.m`):

```objectivec
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(RealityKitViewManager, RCTViewManager)

RCT_EXTERN_METHOD(loadFurniture:(nonnull NSNumber *)reactTag urlString:(NSString *)urlString)
RCT_EXTERN_METHOD(toggleTopView:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(resetCamera:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(captureSnapshot:(nonnull NSNumber *)reactTag)
RCT_EXTERN_METHOD(removeSelectedFurniture:(nonnull NSNumber *)reactTag)
RCT_EXPORT_VIEW_PROPERTY(modelUrl, NSString)
RCT_EXPORT_VIEW_PROPERTY(onSnapshotReady, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFurnitureSelectionChanged, RCTDirectEventBlock)

@end
```

`RCT_EXTERN_MODULE(RealityKitViewManager, RCTViewManager)` is a C preprocessor macro that expands into Objective-C `@interface`/`@implementation` boilerplate for a class named `RealityKitViewManager`. Critically, **this `.m` file is a shim with no actual behavior of its own** — the real implementation is a Swift class, also named `RealityKitViewManager` (`fe/ios/RealityKitFeature/RealityKitViewManager.swift`):

```swift
import Foundation
import React

@objc(RealityKitViewManager)
class RealityKitViewManager: RCTViewManager {

    override static func requiresMainQueueSetup() -> Bool { true }

    override func view() -> UIView! {
        RealityKitView()
    }

    override func constantsToExport() -> [AnyHashable: Any]! {
        [
            "Commands": [
                "loadFurniture": "loadFurniture",
                "toggleTopView": "toggleTopView",
                "resetCamera": "resetCamera",
                "captureSnapshot": "captureSnapshot",
                "removeSelectedFurniture": "removeSelectedFurniture",
            ],
        ]
    }

    @objc func loadFurniture(_ reactTag: NSNumber, urlString: NSString) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.loadFurniture(urlString: urlString as String)
        }
    }
    // toggleTopView, resetCamera, captureSnapshot, removeSelectedFurniture follow the same pattern
}
```

`@objc(RealityKitViewManager)` on the Swift class is what makes Swift/ObjC interop expose this class to the Objective-C runtime **under that exact name string**. Here's the mechanism, precisely:

1. At app launch, the classic bridge scans the Objective-C runtime's class table for classes conforming to `RCTBridgeModule` (or, for view managers, subclassing `RCTViewManager`) — this is a runtime walk over loaded classes, not something resolved by the compiler or linker.
2. `RCT_EXTERN_MODULE`'s expansion in the `.m` file produces exactly the metadata this scan is looking for, tagged with the name `RealityKitViewManager`.
3. Because the *real* Swift class is *also* exposed to the ObjC runtime under the name `RealityKitViewManager` (via `@objc(RealityKitViewManager)`), the runtime's dynamic method resolution treats them as the same class. The `.m` file's declared methods (`RCT_EXTERN_METHOD(loadFurniture:...)`) get satisfied by the Swift class's actual `@objc func loadFurniture(...)` implementation, purely by matching selector names at runtime.
4. RN's naming convention automatically strips a trailing `Manager` — so a view manager class named `RealityKitViewManager` registers its component under the JS-facing name `RealityKitView`, exactly matching the string `requireNativeComponent('RealityKitView')` asks for.

:::tip The crux insight
**The `.m` file never references the Swift type at compile time.** It's not `#import`ing the Swift header and calling into it directly — it's declaring, in Objective-C metadata, "there exists (or will exist) a class named X with these methods," and the Objective-C runtime resolves that name to whatever class actually carries it at launch, dynamically. This is why `fe/ios/fe/fe-Bridging-Header.h` — the file that's normally where you'd expect to see Swift/ObjC interop imports — is completely empty:
```objectivec
#ifndef fe_Bridging_Header_h
#define fe_Bridging_Header_h
#endif /* fe_Bridging_Header_h */
```
Zero imports. Nothing needs importing, because nothing is being linked at compile time — it's all resolved by name, at runtime.
:::

## Why this makes name-syncing load-bearing and silently-wrong-if-broken

Because the connection is a runtime string match rather than a compiler-checked reference, **there is no compile error if the names drift apart.** If someone renamed the Swift class to `RealityKitManager` but left the `.m` file saying `RCT_EXTERN_MODULE(RealityKitViewManager, RCTViewManager)`, both files would compile cleanly — and the app would simply fail to find a working view manager for `'RealityKitView'` at runtime, likely surfacing as a cryptic "no component found" error or a blank view, with no build-time warning pointing at the actual cause. Keep this in mind while reading `RCT_EXPORT_VIEW_PROPERTY`/`RCT_EXTERN_METHOD` declarations on the next few pages — every one of them is a promise that has to be kept by matching Swift code, with nothing enforcing that match except careful reading (or, as [page 09](/docs/native-bridge/new-architecture-contrast) covers, codegen).

## Same mechanism for `RCT_EXTERN_REMAP_MODULE`

`RoomplanViewManager.m` uses the same pattern (`RCT_EXTERN_MODULE`), but you'll also see `RCT_EXTERN_REMAP_MODULE(objc_name, js_name, superclass)` elsewhere in RN codebases — it's the same runtime-name-matching mechanism, just letting you register a Swift class under a *different* JS-facing name than what "strip `Manager`" would automatically produce. [Page 08](/docs/native-bridge/roomplanview-walkthrough) covers a real, since-fixed case where this macro was used incorrectly in this codebase.
