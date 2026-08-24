//
//  RoomplanViewManager.swift
//
//  ── HOW THIS FILE CONNECTS TO JAVASCRIPT ─────────────────────────────────
//  This file holds BOTH halves of the RoomPlan native component:
//
//    • RoomplanViewManager (an RCTViewManager) — the factory React Native
//      talks to. RN finds it because RoomplanViewManager.m declares
//      RCT_EXTERN_MODULE(RoomplanViewManager, RCTViewManager), which looks
//      the class up BY NAME STRING at runtime via the Objective-C runtime —
//      there is no compile-time link between the .m file and this class.
//      The @objc(RoomplanViewManager) attribute below is what publishes the
//      class under that exact name; if the two strings ever drift apart,
//      nothing errors — the component just silently stops existing.
//
//    • RoomplanView (a UIView) — the actual view instance RN mounts. On the
//      JS side, requireNativeComponent('RoomplanView') works because RN
//      strips the "Manager" suffix from the manager's name to derive the
//      component name: RoomplanViewManager → "RoomplanView".
//
//  Data crosses the bridge in three ways:
//    commands  JS → native   dispatchViewManagerCommand → @objc methods here
//    props     JS → native   (none on this component — commands only)
//    events    native → JS   RCTBubblingEventBlock properties on the view;
//                            calling the block IS sending the event
//  ─────────────────────────────────────────────────────────────────────────

import Foundation
import UIKit
import RoomPlan
import React

@objc(RoomplanViewManager)
class RoomplanViewManager: RCTViewManager {

  // RN normally initializes view managers on a background queue. Returning
  // true forces main-queue setup, which RoomPlan/ARKit need — their session
  // and view objects must be created on the main thread.
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // Called by RN every time it needs to mount a <RoomPlanView /> — one call
  // per mounted component instance, not once globally.
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

  // This dict is what JS reads as
  // UIManager.getViewManagerConfig('RoomplanView').Commands — the command
  // "ids" JS passes to dispatchViewManagerCommand. On the classic bridge
  // these can simply be the method-name strings themselves; RN resolves the
  // value back to a selector on this manager at dispatch time.
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

  // ── Commands ─────────────────────────────────────────────────────────────
  // Each command arrives here on the MANAGER with a reactTag — an integer id
  // for the specific mounted view instance. addUIBlock schedules the closure
  // on the UI thread after any pending view-hierarchy updates settle, and
  // hands us the registry to translate tag → live RoomplanView instance.
  // That indirection is the whole reason these methods exist: the manager is
  // a singleton, the views are per-mount, and the tag is how JS addresses one.

  @objc func startScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard let view = viewRegistry?[reactTag] as? RoomplanView else { return }
      view.startScanning()
    }
  }

  @objc func stopScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard let view = viewRegistry?[reactTag] as? RoomplanView else { return }
      view.stopScanning()
    }
  }

  @objc func resetScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard let view = viewRegistry?[reactTag] as? RoomplanView else { return }
      view.resetScanning()
    }
  }

  @objc func abortScanning(_ reactTag: NSNumber) {
    bridge.uiManager.addUIBlock { _, viewRegistry in
      guard let view = viewRegistry?[reactTag] as? RoomplanView else { return }
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

  // Event slot, native → JS. This is NOT an ordinary Swift closure we
  // assign ourselves: React Native injects the block when the JS side
  // passes an onExportComplete prop (the .m file's RCT_EXPORT_VIEW_PROPERTY
  // line is what wires it up). Calling the block IS emitting the event —
  // the dictionary argument arrives in JS as e.nativeEvent.
  @objc var onExportComplete: RCTBubblingEventBlock?

  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .black
  }

  // Required by UIView's designated-initializer rules, but this view is only
  // ever created in code (by the manager's view() method), never from a
  // storyboard/nib — so decoding is deliberately unsupported.
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // Create the RoomCaptureView only once we're actually attached to a
  // window: RoomPlan needs a live view hierarchy, and RN mounts/unmounts
  // this view as the screen navigates. Detaching (window == nil) tears
  // everything down so the camera/session never outlives the screen.
  override func didMoveToWindow() {
    super.didMoveToWindow()

    guard window != nil else {
      cleanup()
      return
    }

    // Set the flag before the async hop so a rapid second didMoveToWindow
    // can't queue a duplicate creation. (createCaptureView sets it again —
    // redundant on this path, but needed when resetScanning() calls it
    // directly after clearing the flag.)
    guard !didCreateView else { return }
    didCreateView = true

    DispatchQueue.main.async { [weak self] in
      self?.createCaptureView()
    }
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

  // The "done" path: stopping WITH the delegate still attached means
  // captureSession(_:didEndWith:) fires next, which processes and exports
  // the scan. Compare abortScanning above, which nils the delegate first
  // precisely so that callback never runs.
  func stopScanning() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      guard self.didStartSession else {
        NSLog("⚠️ No active session to stop")
        return
      }

      NSLog("🛑 Stopping RoomPlan session")

      // Just stop the session; the view stays so the frozen preview remains
      // visible while the export processes.
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

  // Fires after stopScanning() (the delegate is nil'd on the abort/reset
  // paths, so those never reach here). Turns the session's raw capture data
  // into a .usdz the AR viewer can load, then reports the file URL to JS.
  func captureSession(_ session: RoomCaptureSession, didEndWith data: CapturedRoomData, error: Error?) {
    NSLog("📦 RoomPlan session ended")

    // RoomBuilder is async; run the processing in a Task pinned to the main
    // actor since it ends by touching the event block (bridge callbacks
    // should be invoked from the main thread for view events).
    Task(priority: .userInitiated) { @MainActor in
      do {
        NSLog("📦 Starting room builder process")
        // .beautifyObjects smooths/cleans the reconstructed 3D mesh
        let roomBuilder = RoomBuilder(options: [.beautifyObjects])
        let capturedRoom: CapturedRoom = try await roomBuilder.capturedRoom(from: data)

        // Metadata JSON is transient → temp dir. The model itself goes to
        // Documents/savedRoom.usdz — a FIXED name, so each new scan
        // overwrites the previous one. That's deliberate: the app treats
        // "the last scan" as the working file (see RealityKitModule's
        // getSavedRoomUrl, which reads this exact path), and saving a scan
        // permanently means uploading it as a design, not keeping it here.
        let tmpDir = FileManager.default.temporaryDirectory
        let timestamp = Int(Date().timeIntervalSince1970)
        let metadataURL = tmpDir.appendingPathComponent("room_meta_\(timestamp).json")
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let modelURL = documents.appendingPathComponent("savedRoom.usdz")

        if #available(iOS 17.0, *) {
          // iOS 17+: export with the richer metadata-mapping API
          try capturedRoom.export(to: modelURL, metadataURL: metadataURL, modelProvider: nil, exportOptions: CapturedRoom.USDExportOptions())
        } else {
          // iOS 16 fallback: model-only export
          try capturedRoom.export(to: modelURL, exportOptions: CapturedRoom.USDExportOptions())
        }

        let metaData = try Data(contentsOf: metadataURL)
        let metaString = String(data: metaData, encoding: .utf8) ?? "{}"

        // Only the file URL and (small) metadata JSON cross the bridge.
        // The model itself stays on disk — JS passes the URL around and
        // uploads it as a file when saving, so shipping megabytes of model
        // bytes through the bridge would be pure overhead.
        self.onExportComplete?(["json": metaString, "fileUrl": modelURL.absoluteString])

        Task.detached(priority: .utility) {
          // The metadata file was already read into memory; the model file
          // must stay — the AR viewer is about to load it from this URL.
          try? FileManager.default.removeItem(at: metadataURL)
          NSLog("🧹 Temp files cleaned")
        }
      } catch {
        NSLog("❌ RoomPlan processing/export failed: \(error)")
        // No fileUrl key on failure — JS checks for its absence and shows
        // an error instead of navigating to the viewer with nothing to load.
        self.onExportComplete?(["error": error.localizedDescription])
      }
    }
  }
}
