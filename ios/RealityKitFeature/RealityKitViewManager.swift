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
                "exportFurnitureLayout": "exportFurnitureLayout",
                "placeFurnitureFromLayout": "placeFurnitureFromLayout",
            ],
        ]
    }

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
}
