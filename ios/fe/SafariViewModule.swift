//
//  SafariViewModule.swift
//
//  Opens a web page in Apple's in-app Safari sheet (SFSafariViewController),
//  so the user reads it without leaving the app and closes it with Done.
//  Used for the Terms of Use and Privacy Policy, which live on the website
//  so they can be updated without an app release.
//
//  JS: NativeModules.SafariViewModule.open(url) -> Promise<void>
//  (see src/utils/openLegal.ts). Registered in SafariViewModule.m.
//

import UIKit
import SafariServices
import React

@objc(SafariViewModule)
class SafariViewModule: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool { false }

    @objc func open(
        _ urlString: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        // Only web pages: SFSafariViewController can't show other schemes.
        guard let url = URL(string: urlString),
              let scheme = url.scheme?.lowercased(),
              scheme == "https" || scheme == "http" else {
            reject("bad_url", "Not a web link: \(urlString)", nil)
            return
        }

        DispatchQueue.main.async {
            guard let presenter = RCTPresentedViewController() else {
                reject("no_presenter", "No screen to show the page on", nil)
                return
            }
            let safari = SFSafariViewController(url: url)
            safari.dismissButtonStyle = .done
            // Brand gold (#C1A36A) for the Done button and toolbar icons
            safari.preferredControlTintColor = UIColor(
                red: 193 / 255, green: 163 / 255, blue: 106 / 255, alpha: 1)
            safari.modalPresentationStyle = .pageSheet
            presenter.present(safari, animated: true)
            resolve(nil)
        }
    }
}
