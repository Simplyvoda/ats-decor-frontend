//
//  RealityKitModule.swift
//
//  A plain NativeModule — NOT a view. Unlike RealityKitView (which JS mounts
//  as a component), JS reaches this directly as
//  NativeModules.RealityKitModule.someMethod(...).
//
//  Registration follows the same runtime string-matching as the view
//  managers: RealityKitModule.m declares RCT_EXTERN_MODULE(RealityKitModule,
//  NSObject), and the @objc(RealityKitModule) attribute below publishes this
//  class under that exact name. No compile-time link exists between the two.
//

import UIKit
import UniformTypeIdentifiers
import React

@objc(RealityKitModule)
class RealityKitModule: NSObject, UIDocumentPickerDelegate {

    // DEV HELPER, gated at compile time (not just by a comment telling
    // humans to remember to delete it): opens a file picker so you can
    // load a saved .usdz from Files.app without scanning a room every
    // session. Compiled out of Release builds entirely.
    @objc func openARView(_ urlString: NSString) {
        #if DEBUG
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
        #else
        NSLog("⚠️ RealityKitModule.openARView is a DEBUG-only dev tool — no-op in this build.")
        #endif
    }

    // Returns the file:// URL of the last saved room scan (Documents/savedRoom.usdz).
    // Used by the dev button in ScanScreen to jump straight to ARViewerScreen.
    //
    // The promise pattern: the .m file declares the last two arguments as
    // RCTPromiseResolveBlock/RCTPromiseRejectBlock, so JS receives a Promise
    // that settles with whichever block this method calls.
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
