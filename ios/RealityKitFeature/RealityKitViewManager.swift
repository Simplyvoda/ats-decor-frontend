import Foundation
import React

@objc(RealityKitViewManager)
class RealityKitViewManager: RCTViewManager {

    override static func requiresMainQueueSetup() -> Bool { true }

    override func view() -> UIView! {
        RealityKitView()
    }

    override func constantsToExport() -> [AnyHashable: Any]! {
        ["Commands": ["loadFurniture": "loadFurniture"]]
    }

    @objc func loadFurniture(_ reactTag: NSNumber, urlString: NSString) {
        bridge.uiManager.addUIBlock { _, viewRegistry in
            guard let view = viewRegistry?[reactTag] as? RealityKitView else { return }
            view.loadFurniture(urlString: urlString as String)
        }
    }
}
