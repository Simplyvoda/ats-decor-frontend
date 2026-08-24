//
//  RoomplanViewManager.swift
//

import Foundation
import UIKit
import RoomPlan
import React

@objc(RoomplanViewManager)
class RoomplanViewManager: RCTViewManager {

  // 🚨 MUST be true for RoomPlan / ARKit on iOS 17
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func view() -> UIView! {
    if #available(iOS 16.0, *) {
      return RoomplanView()
    } else {
      let label = UILabel()
      label.text = "RoomPlan requires iOS 16+"
      label.textAlignment = .center
      label.textColor = .red
      return label
    }
  }

  override func constantsToExport() -> [AnyHashable : Any]! {
    return [
      "Commands": [
        "startScanning": "startScanning",
        "stopScanning": "stopScanning",
        "resetScanning": "resetScanning",
        "abortScanning": "abortScanning"
      ]
    ]
  }

  @objc func startScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard
        let view = viewRegistry?[reactTag] as? RoomplanView
      else { return }

      view.startScanning()
    }
  }

  @objc func stopScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard
        let view = viewRegistry?[reactTag] as? RoomplanView
      else { return }

      view.stopScanning()
    }
  }

  @objc func resetScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard
        let view = viewRegistry?[reactTag] as? RoomplanView
      else { return }

      view.resetScanning()
    }
  }

  @objc func abortScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard
        let view = viewRegistry?[reactTag] as? RoomplanView
      else { return }

      view.abortScanning()
    }
  }
}

@available(iOS 16.0, *)
@objc(RoomplanView)
class RoomplanView: UIView, RoomCaptureSessionDelegate {

  private var roomCaptureView: RoomCaptureView?
  private var didCreateView = false
  private var didStartSession = false
  private var isCleaningUp = false


  // ✅ ADD THESE EVENT CALLBACK PROPERTIES
  @objc var onScanFinished: RCTBubblingEventBlock?
  @objc var onExportComplete: RCTBubblingEventBlock?

  var latestRoomModelURL: URL?


  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .black
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // ✅ Create RoomCaptureView ONLY when attached to window
  override func didMoveToWindow() {
    super.didMoveToWindow()

    guard window != nil else {
      cleanup()
      return
    }

    guard !didCreateView else { return }
    didCreateView = true

    DispatchQueue.main.async { [weak self] in
      self?.createCaptureView()
    }
  }

  // ✅ Layout must be valid before scanning
  override func layoutSubviews() {
    super.layoutSubviews()
  }

  // Synchronous — caller must already be on main thread. Extracted so
  // resetScanning() can recreate the capture view without duplicating
  // this setup.
  private func createCaptureView() {
    let captureView = RoomCaptureView(frame: self.bounds)
    captureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    captureView.backgroundColor = .black

    self.addSubview(captureView)
    self.roomCaptureView = captureView
    didCreateView = true

    NSLog("✅ RoomCaptureView created and attached")
  }

  // Synchronous — caller must already be on main thread. Extracted so
  // resetScanning() can restart a session without duplicating this guard
  // chain.
  private func beginSession() {
    guard !isCleaningUp else { return }

    guard
      UIApplication.shared.applicationState == .active
    else {
      NSLog("⚠️ beginSession aborted: app not active")
      return
    }

    guard
      let rcv = roomCaptureView,
      bounds.width > 0,
      bounds.height > 0,
      rcv.bounds.width > 0,
      rcv.bounds.height > 0
    else {
      NSLog("⚠️ beginSession aborted: invalid layout")
      return
    }

    guard !didStartSession else {
      NSLog("⚠️ scan already running")
      return
    }

    rcv.captureSession.delegate = nil

    let configuration = RoomCaptureSession.Configuration()

    NSLog("🪟 RoomPlan scan starting")
    didStartSession = true

    // ⚠️ Run FIRST, then assign delegates (prevents race)
    rcv.captureSession.run(configuration: configuration)
    rcv.captureSession.delegate = self
  }

  func startScanning() {
    DispatchQueue.main.async { [weak self] in
      self?.beginSession()
    }
  }

  // Discards any in-progress capture and immediately starts a fresh one,
  // in a single JS-triggered call ("redo" button).
  func resetScanning() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, !self.isCleaningUp else { return }

      NSLog("🔄 resetScanning: discarding in-progress capture and restarting")

      // Nil the delegate BEFORE stopping so a late didEndWith from the old
      // session can never fire and leak stale data into onExportComplete.
      self.roomCaptureView?.captureSession.delegate = nil
      self.roomCaptureView?.captureSession.stop()
      self.didStartSession = false

      // Tear down the capture view entirely rather than re-running the same
      // session object — Apple doesn't document that a stopped session
      // discards previously accumulated room geometry on re-run.
      self.roomCaptureView?.delegate = nil
      self.roomCaptureView?.removeFromSuperview()
      self.roomCaptureView = nil
      self.didCreateView = false

      guard self.window != nil, self.bounds.width > 0, self.bounds.height > 0 else {
        NSLog("⚠️ resetScanning aborted: view not attached / no layout")
        return
      }

      self.createCaptureView()
      self.beginSession()
    }
  }

  // Silently ends the session with no export, so navigating back mid-scan
  // doesn't trigger onExportComplete (that's stopScanning's job).
  func abortScanning() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, self.didStartSession else { return }

      NSLog("🚪 abortScanning: stopping session without export (back navigation)")
      self.roomCaptureView?.captureSession.delegate = nil
      self.roomCaptureView?.captureSession.stop()
      self.didStartSession = false
    }
  }

  func stopScanning() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      guard self.didStartSession else {
        NSLog("⚠️ No active session to stop")
        return
      }

      NSLog("🛑 Stopping RoomPlan session")
      
      // ✅ Just stop the session, keep the view!
      self.roomCaptureView?.captureSession.stop()
      self.didStartSession = false
    }
}

  // MARK: - Cleanup (CRITICAL)

  private func cleanup() {
    guard !isCleaningUp else { return }
    isCleaningUp = true

    NSLog("🧹 Cleaning up RoomPlan session")

    roomCaptureView?.captureSession.stop()
    roomCaptureView?.captureSession.delegate = nil
    roomCaptureView?.delegate = nil

    roomCaptureView?.removeFromSuperview()
    roomCaptureView = nil

    didStartSession = false
    didCreateView = false
    isCleaningUp = false
  }

  override func removeFromSuperview() {
    super.removeFromSuperview()
    cleanup()
  }

  deinit {
    cleanup()
  }

  // MARK: - RoomCaptureSessionDelegate

  func captureSession(_ session: RoomCaptureSession, didUpdate room: CapturedRoom) {
    // no-op
  }

  func captureSession(_ session: RoomCaptureSession, didEndWith data: CapturedRoomData, error: Error?) {
    // convert CapturedRoomData to a format that Reality kit can understand
    // Reality kit will be used to create the walking through a room bit
    NSLog("📦 RoomPlan session ended")

    // dispatch queue runs thing in the background
    Task (priority: .userInitiated) {@MainActor in
    do{
        NSLog("📦 Starting room builder process")
        // The .beautifyObjects option smooths/cleans up the 3D mesh
        let roomBuilder = RoomBuilder(options: [.beautifyObjects])
        let capturedRoom: CapturedRoom = try await roomBuilder.capturedRoom(from: data)
     

        // This gives you the app’s temporary folder inside its private sandbox.
        let tmpDir = FileManager.default.temporaryDirectory
        let timestamp = Int(Date().timeIntervalSince1970)
        let metadataURL = tmpDir.appendingPathComponent("room_meta_\(timestamp).json")
        // let modelURL = tmpDir.appendingPathComponent("room_\(timestamp).usdz")

        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let modelURL = documents.appendingPathComponent("savedRoom.usdz")


        // Use export API on capturedRoom (throws)
        
        if #available(iOS 17.0, *) {
            // iOS 17+: rich export with metadata mapping & modelProvider
            try capturedRoom.export(to: modelURL, metadataURL: metadataURL, modelProvider: nil, exportOptions: CapturedRoom.USDExportOptions())
        } else {
            // iOS 16 fallback: export USDZ using the older API
            try capturedRoom.export(to: modelURL, exportOptions: CapturedRoom.USDExportOptions())
        }

        // saving exported usdz
        self.latestRoomModelURL = modelURL


        // read meta data and json
        let metaData = try Data(contentsOf: metadataURL)
        let metaString = String(data: metaData, encoding: .utf8) ?? "{}"

        // read usdz and base 64 encode
        let modelData = try Data(contentsOf: modelURL)
        let base64Usdz = modelData.base64EncodedString()

        // We only need Base64 if:
        // ✔ You upload to cloud
        // ✔ You store in JS state
        // ✔ You send to backend
        self.onScanFinished?(["roomJson": metaString])
        // onExportComplete with both json + usdz base64
        self.onExportComplete?(["json": metaString, "usdzBase64": base64Usdz, "fileUrl": modelURL.absoluteString])

        // ✅ Clean up immediately after sending
        Task.detached(priority: .utility) {
            try? FileManager.default.removeItem(at: metadataURL)
            // try? FileManager.default.removeItem(at: modelURL)
            NSLog("🧹 Temp files cleaned")
        }
    
        }catch{
        NSLog("❌ RoomPlan processing/export failed: \(error)");
        self.onScanFinished?(["roomJson": ""])
        self.onExportComplete?(["json": "", "usdzBase64": ""])
        }
        }
  }
}
