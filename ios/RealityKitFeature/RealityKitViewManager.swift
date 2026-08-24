import Foundation
import React

// The factory/manager half of the RealityKit bridge. React Native finds this
// class at runtime by NAME STRING: RealityKitViewManager.m declares
// RCT_EXTERN_MODULE(RealityKitViewManager, ...), and the @objc attribute
// below publishes this class under that exact name in the ObjC runtime.
// There is no compile-time link — a typo on either side just makes the
// component silently vanish. On the JS side,
// requireNativeComponent('RealityKitView') resolves because RN strips the
// "Manager" suffix from this class's name to derive the component name.
@objc(RealityKitViewManager)
class RealityKitViewManager: RCTViewManager {

    // Force main-queue setup: this manager creates UIKit/RealityKit views,
    // which must only be touched on the main thread.
    override static func requiresMainQueueSetup() -> Bool { true }

    // One call per mounted <RealityKitNativeView /> — each JS mount gets its
    // own fresh native view instance.
    override func view() -> UIView! {
        RealityKitView()
    }

    // What JS reads as UIManager.getViewManagerConfig('RealityKitView')
    // .Commands — the command ids passed to dispatchViewManagerCommand.
    // On the classic bridge the values can simply be the method-name
    // strings; RN resolves them back to selectors on this manager.
    override func constantsToExport() -> [AnyHashable: Any]! {
        [
            "Commands": [
                "loadFurniture": "loadFurniture",
                "toggleTopView": "toggleTopView",
                "resetCamera": "resetCamera",
                "captureSnapshot": "captureSnapshot",
                "removeSelectedFurniture": "removeSelectedFurniture",
                "exportFurnitureLayout": "exportFurnitureLayout",
                "placeFurnitureFromLayout": "placeFurnitureFromLayout",
                "exportDesignPdf": "exportDesignPdf",
            ],
        ]
    }

    // ── Commands ──────────────────────────────────────────────────────────
    // Commands arrive on this manager (a singleton) carrying a reactTag —
    // the integer id of one mounted view. addUIBlock schedules the closure
    // on the UI thread after pending view-hierarchy updates settle and
    // provides the registry that maps tag → live view instance. That's the
    // whole job of these methods: translate "JS said do X to view #42" into
    // a plain Swift method call on the right RealityKitView.

    @objc func loadFurniture(_ reactTag: NSNumber, urlString: NSString) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.loadFurniture(urlString: urlString as String)
        }
    }

    @objc func toggleTopView(_ reactTag: NSNumber) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.toggleTopView()
        }
    }

    @objc func resetCamera(_ reactTag: NSNumber) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.resetCamera()
        }
    }

    @objc func captureSnapshot(_ reactTag: NSNumber) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.captureSnapshot()
        }
    }

    @objc func removeSelectedFurniture(_ reactTag: NSNumber) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.removeSelectedFurniture()
        }
    }

    @objc func exportFurnitureLayout(_ reactTag: NSNumber) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.exportFurnitureLayout()
        }
    }

    @objc func placeFurnitureFromLayout(_ reactTag: NSNumber, itemJson: NSString) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.placeFurnitureFromLayout(itemJson as String)
        }
    }

    @objc func exportDesignPdf(_ reactTag: NSNumber, name: NSString) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.exportDesignPdf(name: name as String)
        }
    }
}
