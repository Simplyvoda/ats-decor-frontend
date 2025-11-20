//
//  RoomplanViewManager.swift
//  fe
//
//  Created by Vodina Efem on 15/11/2025.
//

import Foundation
import UIKit
import RoomPlan
import React

// View manager bridge
@objc(RoomplanViewManager)
class RoomplanViewManager: RCTViewManager {
  override static func requiresMainQueueSetup() -> Bool { return false }

  override func view() -> UIView! {
    if #available(iOS 16.0, *) {
      return RoomplanView(frame: .zero)  // see below
    } else {
      let label = UILabel()
      label.text = "RoomPlan requires iOS 16+"
      label.textColor = .red
      label.textAlignment = .center
      return label
    }
  }

  // Expose commands so JavaScript can trigger methods
  override func constantsToExport() -> [AnyHashable : Any]! {
    return ["Commands": [
      "startScanning": "startScanning",
      "stopScanning": "stopScanning",
      "exportScanResults": "exportScanResults"
    ]]
  }

  // Called when JS dispatches a command on this view
  @objc func startScanning(_ reactTag: NSNumber) {
    DispatchQueue.main.async {
      guard let uiManager = self.bridge.uiManager,
            let view = uiManager.view(forReactTag: reactTag) as? RoomplanView else {
        print("❌ startScanning: view not found for tag \(reactTag)")
        return
      }
      view.startScanning()
    }
  }
  @objc func stopScanning(_ reactTag: NSNumber) {
    DispatchQueue.main.async {
      guard let uiManager = self.bridge.uiManager,
            let view = uiManager.view(forReactTag: reactTag) as? RoomplanView else {
        print("❌ stopScanning: view not found")
        return
      }
      view.stopScanning()
    }
  }
  @objc func exportScanResults(_ reactTag: NSNumber) {
    DispatchQueue.main.async {
      guard let uiManager = self.bridge.uiManager,
            let view = uiManager.view(forReactTag: reactTag) as? RoomplanView else {
        print("❌ exportScanResults: view not found")
        return
      }
      view.exportScanResults()
    }
  }
}


// The UIView that hosts RoomCaptureView and handles scanning
@objc(RoomplanView)
class RoomplanView: UIView {
  // The RoomPlan capture view and session
  private var roomCaptureView: RoomCaptureView?
  private var finalResults: CapturedRoom?  // will hold the scanned room data
  @objc var onScanFinished: RCTDirectEventBlock?  // JavaScript callback
  @objc var onExportComplete: RCTDirectEventBlock?

  override init(frame: CGRect) {
    super.init(frame: frame)
    // Only on iOS 16+
    if #available(iOS 16.0, *) {
      let rcv = RoomCaptureView(frame: self.bounds)
      rcv.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      rcv.delegate = self
      rcv.captureSession.delegate = self
      self.addSubview(rcv)
      self.roomCaptureView = rcv
    }
  }
  required init?(coder: NSCoder) { super.init(coder: coder) }

  // Start scanning (called from JS)
  @objc func startScanning() {
    guard #available(iOS 16.0, *),
          let rcv = roomCaptureView,
          let config = RoomCaptureSession.Configuration() as RoomCaptureSession.Configuration? else {
      print("❌ startScanning failed: not available")
      return
    }
    // (Optionally config.coachingEnabled = true/false)
    rcv.captureSession.run(configuration: config)
  }
  @objc func stopScanning() {
    guard #available(iOS 16.0, *),
          let rcv = roomCaptureView else {
      print("❌ stopScanning failed")
      return
    }
    rcv.captureSession.stop()
  }

  // Export the final scan as JSON + USDZ (called from JS)
  @objc func exportScanResults() {
    guard #available(iOS 16.0, *),
          let results = finalResults else {
      print("❌ exportScanResults: no scanned room available")
      return
    }
    do {
      let jsonData = try JSONEncoder().encode(results)
      let jsonString = String(data: jsonData, encoding: .utf8) ?? ""
      // Export USDZ file to temp directory
      let tmpDir = FileManager.default.temporaryDirectory
      let usdzURL = tmpDir.appendingPathComponent("Room.usdz")
      try results.export(to: usdzURL, exportOptions: .parametric)  // parametric is default
      let usdzData = try Data(contentsOf: usdzURL)
      let usdzBase64 = usdzData.base64EncodedString()
      // Send back to JavaScript
      onExportComplete?(["json": jsonString, "usdzBase64": usdzBase64])
    } catch {
      print("❌ exportScanResults failed: \(error)")
    }
  }
}

// MARK: - RoomCaptureViewDelegate & RoomCaptureSessionDelegate
@available(iOS 16.0, *)
extension RoomplanView: RoomCaptureViewDelegate, RoomCaptureSessionDelegate {
  // Called as rooms are detected; return true to use results
  func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool {
    return true
  }
  // Called when a room is fully scanned (after stop)
  func captureView(didPresent processedResult: CapturedRoom, error: Error?) {
    self.finalResults = processedResult
    // Fire event to JS with JSON string
    if let onScanFinished = onScanFinished {
      do {
        let jsonData = try JSONEncoder().encode(processedResult)
        let jsonString = String(data: jsonData, encoding: .utf8) ?? ""
        onScanFinished(["roomJson": jsonString])
      } catch {
        onScanFinished(["roomJson": ""])
      }
    }
  }
}
