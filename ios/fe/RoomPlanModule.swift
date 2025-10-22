import Foundation
import UIKit

@objc(RoomPlanModule)
class RoomPlanModule: NSObject {
  override init() {
    super.init()
    print("RoomPlanModule loaded!");
    print("RoomPlanModule is the module name");
  }

  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc(startScan:rejecter:)
  func startScan(resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {

    guard #available(iOS 16.0, *) else {
      reject("E_IOS_VERSION", "RoomPlan requires iOS 16+", nil)
      return
    }

    // Create VC and present it fullscreen
    let scanner = RoomScannerViewController()
    scanner.modalPresentationStyle = .fullScreen
    scanner.onFinished = { url, error in
      DispatchQueue.main.async {
        scanner.dismiss(animated: true)
        if let error = error {
          reject("E_SCAN", "Room scan failed: \(error.localizedDescription)", error)
        } else if let url = url {
          resolve(["usdzPath": url.path])
        } else {
          reject("E_EMPTY", "No result or error from scan", nil)
        }
      }
    }

    DispatchQueue.main.async {
      guard let root = UIApplication.shared.windows.first?.rootViewController else {
        reject("E_UI", "No rootViewController to present scanner", nil)
        return
      }
      root.present(scanner, animated: true) {
        scanner.start()
      }
    }
  }

  @objc(stopScan)
  func stopScan() {
    // Optional: if you retain scanner somewhere, you can call stop from JS.
    // Kept minimal here.
  }
}
