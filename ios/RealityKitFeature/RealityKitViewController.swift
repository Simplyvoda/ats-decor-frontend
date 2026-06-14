import UIKit
import UniformTypeIdentifiers
import React

// Dev-only: thin VC that wraps RealityKitView for the document-picker test flow.
// In production the app navigates to ARViewerScreen (RN) which embeds RealityKitView directly.
class RealityKitViewController: UIViewController {
    var modelURL: URL?
    private var realityKitView: RealityKitView!

    override func viewDidLoad() {
        super.viewDidLoad()
        realityKitView = RealityKitView(frame: view.bounds)
        realityKitView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(realityKitView)

        if let url = modelURL {
            realityKitView.loadRoom(from: url)
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
    }
}

@objc(RealityKitModule)
class RealityKitModule: NSObject, UIDocumentPickerDelegate {

    // ─────────────────────────────────────────────
    // DEV HELPER: comment this block out in production.
    // Opens a file picker so you can load a saved .usdz from Files.app
    // without having to scan a room every session.
    @objc func openARView(_ urlString: NSString) {
        DispatchQueue.main.async {
            guard let rootVC = UIApplication.shared.connectedScenes
                .compactMap({ ($0 as? UIWindowScene)?.keyWindow })
                .first?.rootViewController
            else { return }

            let picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.usdz])
            picker.allowsMultipleSelection = false
            picker.delegate = self
            rootVC.present(picker, animated: true)
        }
    }
    // ─────────────────────────────────────────────

    // Returns the file:// URL of the last saved room scan (Documents/savedRoom.usdz).
    // Used by the dev button in ScanScreen to jump straight to ARViewerScreen.
    @objc func getSavedRoomUrl(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let url = documents.appendingPathComponent("savedRoom.usdz")
        if FileManager.default.fileExists(atPath: url.path) {
            resolve(url.absoluteString)
        } else {
            reject("NO_SAVED_ROOM", "savedRoom.usdz not found — scan a room first", nil)
        }
    }

    @objc func openRoomViewer() {
        DispatchQueue.main.async {
            guard let rootVC = UIApplication.shared.connectedScenes
                .compactMap({ ($0 as? UIWindowScene)?.keyWindow })
                .first?.rootViewController
            else { return }
            let vc = RealityKitViewController()
            vc.modalPresentationStyle = .fullScreen
            rootVC.present(vc, animated: true)
        }
    }

    // MARK: - UIDocumentPickerDelegate

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else { return }

        // Keep the security scope open until after the async load starts inside the VC
        let didStart = url.startAccessingSecurityScopedResource()

        guard let rootVC = UIApplication.shared.connectedScenes
            .compactMap({ ($0 as? UIWindowScene)?.keyWindow })
            .first?.rootViewController
        else {
            if didStart { url.stopAccessingSecurityScopedResource() }
            return
        }

        let arVC = RealityKitViewController()
        arVC.modalPresentationStyle = .fullScreen
        arVC.modelURL = url

        rootVC.present(arVC, animated: true) {
            // Release scope after the VC is presented and load task has started
            if didStart { url.stopAccessingSecurityScopedResource() }
        }
    }
}
