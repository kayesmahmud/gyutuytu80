import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:app_tracking_transparency/app_tracking_transparency.dart';
import 'package:marionette_flutter/marionette_flutter.dart';

import 'core/api/dio_client.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/chat_provider.dart';
import 'core/providers/notification_provider.dart';
import 'core/services/analytics_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/reengagement_service.dart';
import 'core/services/ad_service.dart';
import 'core/services/interstitial_ad_service.dart';
import 'core/services/version_check_service.dart';
import 'core/widgets/update_dialog.dart';
import 'core/widgets/connectivity_wrapper.dart';
import 'features/main_nav/main_nav_screen.dart';
import 'features/splash/splash_screen.dart';
import 'features/messages/chat_screen.dart';
import 'features/notifications/notification_screen.dart';
import 'features/ad_detail/ad_detail_screen.dart';
import 'features/verification/verification_screen.dart';

/// Global navigator key for notification navigation
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Whether Firebase was initialized successfully
bool _firebaseInitialized = false;

void main() async {
  // Silence all debugPrint calls in release builds to prevent information
  // leakage via logcat. debugPrint normally runs in release — only assert()
  // is stripped. This makes the 120+ debugPrint call sites safe to ship.
  if (kReleaseMode) {
    debugPrint = (String? message, {int? wrapWidth}) {};

    // Replace the default release ErrorWidget (a bare gray box that is
    // indistinguishable from renderer corruption) with a recognizable screen,
    // so build exceptions in production are visible and reportable.
    ErrorWidget.builder = (details) => const _ReleaseErrorScreen();
  }

  // Initialize Marionette for AI-assisted testing (debug only)
  if (kDebugMode) {
    MarionetteBinding.ensureInitialized();
  } else {
    WidgetsFlutterBinding.ensureInitialized();
  }

  // Lock the app to portrait — never auto-rotate, never landscape.
  // Native config (Info.plist / AndroidManifest) enforces this at the window
  // level; this call enforces it from the engine for full coverage.
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Initialize SSL certificate pinning (no-op in dev if cert file is absent)
  await DioClient.ensureInitialized();

  // Initialize easy_localization
  await EasyLocalization.ensureInitialized();

  // Initialize Firebase (optional - may not be configured in dev)
  try {
    await Firebase.initializeApp();
    _firebaseInitialized = true;
    AnalyticsService.initialize();
    debugPrint('✅ Firebase initialized successfully');
  } catch (e) {
    debugPrint('⚠️ Firebase not configured: $e');
    debugPrint('Push notifications will be disabled');
  }

  // Google Mobile Ads init is deferred to ThuloBazaarApp.initState so it runs
  // AFTER the App Tracking Transparency prompt resolves (Apple requires the ATT
  // prompt to be shown while the app is active, not during main()). See
  // _requestTrackingThenInitAds below.

  // Initialize notifications only if Firebase is available — OFF critical path.
  // FCM token registration in ThuloBazaarApp.initState already runs after
  // first frame, so channel/handler setup doesn't need to block runApp().
  if (_firebaseInitialized) {
    final notificationService = NotificationService();
    unawaited(
      notificationService
          .initialize()
          .then((_) {
            notificationService.onNotificationTap = _handleNotificationTap;
            debugPrint('✅ Notifications initialized');
            // Replay a local-notification tap that launched the app from
            // terminated (e.g. a re-engagement notification).
            return notificationService.processLaunchNotification();
          })
          .catchError((e) => debugPrint('⚠️ Notifications init failed: $e')),
    );
  }

  // Start listening for App Links / Universal Links (e.g. shared ad URLs).
  // Off the critical path — captured links are deferred until the app is ready.
  unawaited(_initDeepLinks());

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('ne')],
      path: 'assets/translations',
      fallbackLocale: const Locale('en'),
      child: MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => ChatProvider()),
          ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ],
        child: const ThuloBazaarApp(),
      ),
    ),
  );
}

/// Pending notification data when navigator isn't ready (terminated state)
Map<String, dynamic>? _pendingNotification;

/// App Links / Universal Links handler. Opens https://thulobazaar.com.np
/// /{lang}/ad/{slug} URLs directly in the app (the OS routes them here when the
/// app is installed and the domain is verified; otherwise they open in the
/// browser). Shop/search/other pages are intentionally not claimed.
final AppLinks _appLinks = AppLinks();

/// Incoming deep link captured before the app was ready to navigate (cold start,
/// while the splash is still showing). Replayed by [processPendingDeepLink].
Uri? _pendingDeepLink;

/// Start listening for incoming app links — both the cold-start launch URL and
/// links that arrive while the app is already running.
Future<void> _initDeepLinks() async {
  // Cold-start link.
  try {
    final initial = await _appLinks.getInitialLink();
    if (initial != null) _handleIncomingLink(initial);
  } catch (e) {
    debugPrint('⚠️ getInitialLink failed: $e');
  }
  // Warm links — the stream retains the subscription, so it is not cancelled.
  _appLinks.uriLinkStream.listen(
    _handleIncomingLink,
    onError: (Object e) => debugPrint('⚠️ uriLinkStream error: $e'),
  );
}

/// Parse an incoming URL and, if it points at an ad detail page
/// (/{lang}/ad/{slug}), open that ad. Defers until the navigator is ready.
void _handleIncomingLink(Uri uri) {
  final segments = uri.pathSegments; // e.g. ['en', 'ad', 'my-ad-slug']
  final adIndex = segments.indexOf('ad');
  // Guard against the plural '/ads/' search route — indexOf('ad') won't match it.
  if (adIndex == -1 || adIndex + 1 >= segments.length) return;
  final slug = segments[adIndex + 1];
  if (slug.isEmpty) return;

  // Defer until MainNav is the base route (and navigator exists), so a
  // cold-start link isn't clobbered by the splash transition.
  if (!appReadyForDeepLinks || navigatorKey.currentState == null) {
    _pendingDeepLink = uri;
    return;
  }

  navigatorKey.currentState!.push(
    MaterialPageRoute(builder: (_) => AdDetailScreen(slug: slug)),
  );
}

/// Replay any deep link that arrived before the app was ready to navigate.
/// Safe to call multiple times — no-ops when nothing is pending.
void processPendingDeepLink() {
  final uri = _pendingDeepLink;
  if (uri == null) return;
  _pendingDeepLink = null;
  _handleIncomingLink(uri);
}

/// True once SplashScreen has handed off to MainNavScreen. Until then, deep-link
/// taps are stored and replayed later — otherwise the splash's
/// pushReplacement(MainNav) at ~2s replaces any screen we push too early during
/// a cold start (the cause of "tap chat push → lands on message list").
bool appReadyForDeepLinks = false;

/// Handle notification taps and navigate
void _handleNotificationTap(String? route, Map<String, dynamic>? data) {
  // Defer until MainNav is the base route (and navigator exists), so a
  // cold-start deep link isn't clobbered by the splash transition.
  // Checked before the tap analytics so a deferred tap is logged exactly
  // once — on replay, not on both the initial call and the replay.
  if (route != null &&
      (!appReadyForDeepLinks || navigatorKey.currentState == null)) {
    _pendingNotification = {'route': route, ...?data};
    return;
  }

  // Measure re-engagement notification taps.
  if (data?['source'] == 'reengage') {
    AnalyticsService.logReengageTapped('${data?['n'] ?? ''}');
  }

  if (route == null) return;

  // FCM data values are always strings — parse IDs
  final conversationId = int.tryParse('${data?['conversationId'] ?? ''}');
  final adId = int.tryParse('${data?['adId'] ?? ''}');

  final navigator = navigatorKey.currentState!;

  switch (route) {
    case '/chat':
      if (conversationId != null) {
        final senderName = data?['senderName'] as String? ?? 'Chat';
        navigator.push(
          MaterialPageRoute(
            builder: (_) => ChatScreen(
              conversationId: conversationId,
              recipientName: senderName,
              adId: adId,
            ),
          ),
        );
      }
      break;
    case '/ad':
      if (adId != null) {
        navigator.push(
          MaterialPageRoute(builder: (_) => AdDetailScreen(adId: adId)),
        );
      }
      break;
    case '/verification':
      navigator.push(
        MaterialPageRoute(builder: (_) => const VerificationScreen()),
      );
      break;
    case '/notifications':
      navigator.push(
        MaterialPageRoute(builder: (_) => const NotificationScreen()),
      );
      break;
    default:
      break;
  }
}

/// Process any pending notification that arrived before the app was ready to
/// deep-link. Safe to call multiple times — it no-ops when nothing is pending.
void processPendingNotification() {
  if (_pendingNotification == null) return;
  final data = Map<String, dynamic>.from(_pendingNotification!);
  _pendingNotification = null;
  final route = data.remove('route') as String?;
  _handleNotificationTap(route, data);
}

/// Shown in place of a widget whose build threw in a release build. Kept free
/// of fonts, localization, and theme lookups — it must render even when the
/// app's infrastructure is the thing that failed. It replaces only the failed
/// subtree, so it must also look sane at small sizes (hence FittedBox).
class _ReleaseErrorScreen extends StatelessWidget {
  const _ReleaseErrorScreen();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 48),
            const SizedBox(height: 16),
            const Text(
              'Something went wrong',
              style: TextStyle(
                color: Color(0xFF111827),
                fontSize: 18,
                fontWeight: FontWeight.w600,
                decoration: TextDecoration.none,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'केही गडबड भयो — कृपया एप बन्द गरेर फेरि खोल्नुहोस्',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
                fontWeight: FontWeight.w400,
                decoration: TextDecoration.none,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ThuloBazaarApp extends StatefulWidget {
  const ThuloBazaarApp({super.key});

  @override
  State<ThuloBazaarApp> createState() => _ThuloBazaarAppState();
}

class _ThuloBazaarAppState extends State<ThuloBazaarApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    // Observe lifecycle for signed-out re-engagement scheduling
    WidgetsBinding.instance.addObserver(this);
    // Ask every user for notification permission shortly after the home
    // screen settles (product decision 2026-08-05: reach over accept-rate).
    // Idempotent — the intent triggers (search/favourite) remain as no-ops.
    // Once answered, arm the signed-out re-engagement timer while the app is
    // alive (scheduling at pause-time dies to the HyperOS app freezer).
    Future.delayed(const Duration(seconds: 5), () async {
      await NotificationService().requestPermissionsIfNeeded();
      if (!mounted) return;
      final authProvider = context.read<AuthProvider>();
      if (!authProvider.isAuthenticated) {
        unawaited(
          ReEngagementService.onAppResumed(context.locale.languageCode),
        );
      }
    });
    // Request App Tracking Transparency, then initialize ads (Apple-compliant)
    _requestTrackingThenInitAds();
    // Register FCM token when user is logged in
    _registerNotificationToken();
    // Check for app updates
    _checkForAppUpdate();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Signed-out users: schedule a local re-engagement notification when the
  /// app is backgrounded; settle/cancel it when they come back on their own.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      final authProvider = context.read<AuthProvider>();
      if (!authProvider.isAuthenticated) {
        unawaited(
          ReEngagementService.onAppBackgrounded(context.locale.languageCode),
        );
      }
    } else if (state == AppLifecycleState.resumed) {
      final authProvider = context.read<AuthProvider>();
      if (!authProvider.isAuthenticated) {
        unawaited(
          ReEngagementService.onAppResumed(context.locale.languageCode),
        );
      }
    }
  }

  /// Show the iOS App Tracking Transparency prompt (once), then initialize the
  /// Mobile Ads SDK. AdMob reads the resulting authorization status to decide
  /// between personalized and non-personalized ads. No-op on Android and on
  /// iOS versions without ATT — the package reports a safe status and ads
  /// initialize either way.
  Future<void> _requestTrackingThenInitAds() async {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        final status =
            await AppTrackingTransparency.trackingAuthorizationStatus;
        if (status == TrackingStatus.notDetermined) {
          // Brief delay so the system dialog reliably presents on a cold start.
          await Future.delayed(const Duration(milliseconds: 200));
          await AppTrackingTransparency.requestTrackingAuthorization();
        }
      } catch (e) {
        debugPrint('⚠️ ATT request failed: $e');
      }

      try {
        await AdService.initialize();
        await AdService.fetchConfig();
        InterstitialAdService.preload();
      } catch (e) {
        debugPrint('⚠️ AdMob init failed: $e');
      }
    });
  }

  Future<void> _checkForAppUpdate() async {
    // Wait for navigator to be ready
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final result = await VersionCheckService.checkForUpdate();
      if (!mounted) return;
      final ctx = navigatorKey.currentContext;
      if (ctx == null) return;

      switch (result.type) {
        case UpdateType.softPrompt:
          UpdateDialog.showSoftPrompt(
            ctx,
            storeUrl: result.storeUrl,
            latestVersion: result.latestVersion,
          );
        case UpdateType.forceUpdate:
          UpdateDialog.showForceScreen(
            ctx,
            storeUrl: result.storeUrl,
            latestVersion: result.latestVersion,
          );
        case UpdateType.none:
          break;
      }
    });
  }

  Future<void> _registerNotificationToken() async {
    // Skip if Firebase is not initialized
    if (!_firebaseInitialized) return;

    // Wait for auth state to be ready
    await Future.delayed(const Duration(seconds: 1));

    final authProvider = context.read<AuthProvider>();
    final notificationProvider = context.read<NotificationProvider>();

    if (authProvider.isAuthenticated) {
      NotificationService().registerToken();
      notificationProvider.initialize();
      // Signed-in users get real push — end local re-engagement forever
      unawaited(ReEngagementService.disablePermanently());
      // Process any notification that arrived before navigator/auth was ready
      processPendingNotification();
    }

    // Listen for auth changes
    authProvider.addListener(() {
      if (authProvider.isAuthenticated) {
        NotificationService().registerToken();
        notificationProvider.initialize();
        // Signed-in users get real push — end local re-engagement forever
        unawaited(ReEngagementService.disablePermanently());
        // Process any pending notification after login
        processPendingNotification();
      } else {
        NotificationService().unregisterToken();
        notificationProvider.reset();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Thulo Bazaar',
      theme: AppTheme.lightTheme,
      home: const SplashScreen(nextScreen: MainNavScreen()),
      debugShowCheckedModeBanner: false,
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      builder: (context, child) => ConnectivityWrapper(child: child!),
    );
  }
}
