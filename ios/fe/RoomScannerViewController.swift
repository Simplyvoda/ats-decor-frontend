import UIKit
import RoomPlan

final class RoomScannerViewController: UIViewController, RoomCaptureViewDelegate, RoomCaptureSessionDelegate {

  private let captureView = RoomCaptureView(frame: .zero)
  private var config = RoomCaptureSession.Configuration()
  var onFinished: ((URL?, Error?) -> Void)?

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .black
    captureView.frame = view.bounds
    captureView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(captureView)

    captureView.delegate = self
    captureView.captureSession.delegate = self

    // Coaching UI makes the scan flow friendlier
    config.isCoachingEnabled = true
  }

  func start() {
    captureView.captureSession.run(configuration: config)
  }

  @objc func stop(pauseARSession: Bool = true) {
    // If you want to preserve ARSession for multi-room, pass false here
    captureView.captureSession.stop(pauseARSession: pauseARSession)
  }

  // MARK: RoomCaptureSessionDelegate
  func captureSession(_ session: RoomCaptureSession, didEndWith data: CapturedRoom, error: Error?) {
    if let error = error {
      onFinished?(nil, error)
      return
    }
    do {
      let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
      // Don't start filename with a number; export will complain in some cases.
      // e.g. "scan-<timestamp>.usdz"
      let outURL = docs.appendingPathComponent("scan-\(Int(Date().timeIntervalSince1970)).usdz")

      try data.export(to: outURL, exportOptions: .parametric) // or .mesh / combine
      onFinished?(outURL, nil)
    } catch {
      onFinished?(nil, error)
    }
  }

  // Optional live callbacks if you want progress:
  func captureSession(_ session: RoomCaptureSession, didUpdate room: CapturedRoom) {
    // stream progress if needed
  }
}
