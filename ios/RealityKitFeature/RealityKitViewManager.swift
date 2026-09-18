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
                "captureTopViewSnapshot": "captureTopViewSnapshot",
                "removeSelectedFurniture": "removeSelectedFurniture",
                "exportFurnitureLayout": "exportFurnitureLayout",
                "placeFurnitureFromLayout": "placeFurnitureFromLayout",
                "exportDesignPdf": "exportDesignPdf",
            ],
        ]
    }

    // ── Commands ──────────────────────────────────────────────────────────
    // Commands arrive on this manager (a singleton) carrying a reactTag —
    // the integer id of one mounted view. withView schedules the lookup on
    // the UI thread (via addUIBlock, after pending view-hierarchy updates
    // settle) and translates the tag into the live RealityKitView instance,
    // or does nothing if it no longer resolves to one. Every command below
    // is just "translate JS's reactTag into a method call on that view" —
    // see RoomplanViewManager.swift's withView for the same pattern applied
    // to the other native view in this app.

    private func withView(_ reactTag: NSNumber, _ action: @escaping (RealityKitView) -> Void) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            action(view)
        }
    }

    @objc func loadFurniture(_ reactTag: NSNumber, urlString: NSString, isFlat: Bool) {
        withView(reactTag) { $0.loadFurniture(urlString: urlString as String, isFlat: isFlat) }
    }

    @objc func toggleTopView(_ reactTag: NSNumber) {
        withView(reactTag) { $0.toggleTopView() }
    }

    @objc func resetCamera(_ reactTag: NSNumber) {
        withView(reactTag) { $0.resetCamera() }
    }

    @objc func captureSnapshot(_ reactTag: NSNumber) {
        withView(reactTag) { $0.captureSnapshot() }
    }

    @objc func captureTopViewSnapshot(_ reactTag: NSNumber) {
        withView(reactTag) { $0.captureTopViewSnapshot() }
    }

    @objc func removeSelectedFurniture(_ reactTag: NSNumber) {
        withView(reactTag) { $0.removeSelectedFurniture() }
    }

    @objc func exportFurnitureLayout(_ reactTag: NSNumber) {
        withView(reactTag) { $0.exportFurnitureLayout() }
    }

    @objc func placeFurnitureFromLayout(_ reactTag: NSNumber, itemJson: NSString) {
        withView(reactTag) { $0.placeFurnitureFromLayout(itemJson as String) }
    }

    @objc func exportDesignPdf(_ reactTag: NSNumber, name: NSString) {
        withView(reactTag) { $0.exportDesignPdf(name: name as String) }
    }
}
