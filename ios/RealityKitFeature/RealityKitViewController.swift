//
//  RealityKitViewController.swift
//
//  Dev-only: a thin UIViewController that wraps RealityKitView for the
//  document-picker test flow (see RealityKitModule.openARView). In
//  production the app navigates to ARViewerScreen (React Native), which
//  embeds RealityKitView directly — this VC is never in that path.
//

import UIKit

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
}
