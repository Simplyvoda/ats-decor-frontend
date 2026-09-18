import UIKit
import React
import React_RCTAppDelegate

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "fe",
      in: window,
      launchOptions: nil
    )

    // Cold launch via atsdecor:// deep link (email confirmation, password
    // reset) — the equivalent case while already running is handled below
    // in scene(_:openURLContexts:).
    if let url = connectionOptions.urlContexts.first?.url {
      RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
    }
  }

  // Forwards atsdecor:// deep links to React Native's Linking module while
  // the app is already running. Under Scene lifecycle, UIKit no longer
  // calls AppDelegate's application(_:open:options:) for this — it routes
  // through the scene instead.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
  }
}
