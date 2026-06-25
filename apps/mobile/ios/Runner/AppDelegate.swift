import Flutter
import UIKit
import FirebaseCore
import FirebaseMessaging

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Configure Firebase natively before messaging registers for remote
    // notifications. The Dart-side Firebase.initializeApp() reuses this app.
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }

    // Register for remote notifications so APNs delivers a device token.
    UNUserNotificationCenter.current().delegate = self
    application.registerForRemoteNotifications()

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Bridge the APNs device token to Firebase Messaging explicitly. Under the new
  // UIScene / implicit-engine lifecycle, Firebase's swizzling does not reliably
  // capture this token, so without this the FCM token is never generated on iOS.
  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    Messaging.messaging().apnsToken = deviceToken
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  // Universal Links: under the UIScene lifecycle iOS can fail to mark a tapped
  // link as "claimed", so it opens the link in Safari in addition to the app.
  // Forwarding to super returns `true` for a handled link, which tells iOS not
  // to fall back to Safari. (Community workaround for flutter/flutter#179452.)
  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return super.application(
      application, continue: userActivity, restorationHandler: restorationHandler)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)

    // Native share sheet. share_plus locates the host view controller via the
    // app's keyWindow, which is nil under the UIScene / implicit-engine
    // lifecycle, so its share sheet silently never presents. Present
    // UIActivityViewController ourselves from a scene-aware view controller.
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "NativeShare") {
      let channel = FlutterMethodChannel(
        name: "app/native_share",
        binaryMessenger: registrar.messenger())
      channel.setMethodCallHandler { call, result in
        guard call.method == "share" else {
          result(FlutterMethodNotImplemented)
          return
        }
        let args = call.arguments as? [String: Any]
        let text = args?["text"] as? String ?? ""
        let subject = args?["subject"] as? String
        AppDelegate.presentShareSheet(text: text, subject: subject, result: result)
      }
    }
  }

  /// Top-most presented view controller, found in a UIScene-aware way. Falls
  /// back to the scene's first window when no window reports `isKeyWindow` —
  /// the exact case where share_plus returns nil.
  private static func topViewController() -> UIViewController? {
    let windowScenes = UIApplication.shared.connectedScenes.compactMap {
      $0 as? UIWindowScene
    }
    let scene =
      windowScenes.first { $0.activationState == .foregroundActive }
      ?? windowScenes.first
    let window = scene?.windows.first { $0.isKeyWindow } ?? scene?.windows.first
    var top = window?.rootViewController
    while let presented = top?.presentedViewController {
      top = presented
    }
    return top
  }

  private static func presentShareSheet(
    text: String, subject: String?, result: @escaping FlutterResult
  ) {
    guard let host = topViewController() else {
      result(
        FlutterError(
          code: "no_view_controller",
          message: "No view controller to present share sheet from",
          details: nil))
      return
    }
    let itemSource = ShareItemSource(text: text, subject: subject)
    let activityVC = UIActivityViewController(
      activityItems: [itemSource], applicationActivities: nil)
    // iPad requires a popover anchor; center it on the host view.
    if let popover = activityVC.popoverPresentationController {
      popover.sourceView = host.view
      popover.sourceRect = CGRect(
        x: host.view.bounds.midX, y: host.view.bounds.midY, width: 0, height: 0)
      popover.permittedArrowDirections = []
    }
    host.present(activityVC, animated: true) {
      result(nil)
    }
  }
}

/// Supplies the share text and (for mail) a subject the crash-safe way —
/// UIActivityViewController has no `subject` property, so the KVC hack risks an
/// NSUnknownKeyException.
private final class ShareItemSource: NSObject, UIActivityItemSource {
  private let text: String
  private let subject: String?

  init(text: String, subject: String?) {
    self.text = text
    self.subject = subject
  }

  func activityViewControllerPlaceholderItem(
    _ activityViewController: UIActivityViewController
  ) -> Any {
    return text
  }

  func activityViewController(
    _ activityViewController: UIActivityViewController,
    itemForActivityType activityType: UIActivity.ActivityType?
  ) -> Any? {
    return text
  }

  func activityViewController(
    _ activityViewController: UIActivityViewController,
    subjectForActivityType activityType: UIActivity.ActivityType?
  ) -> String {
    return subject ?? ""
  }
}

/// Flutter's recommended SceneDelegate. Subclassing FlutterSceneDelegate is all
/// that's needed — it forwards scene lifecycle events (including the Universal
/// Link `scene(_:continue:)`) to the registered plugins (e.g. app_links).
@objc(SceneDelegate)
class SceneDelegate: FlutterSceneDelegate {}
