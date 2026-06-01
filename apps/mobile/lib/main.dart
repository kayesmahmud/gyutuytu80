import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:marionette_flutter/marionette_flutter.dart';

import 'core/api/dio_client.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/chat_provider.dart';
import 'core/providers/notification_provider.dart';
import 'core/services/notification_service.dart';
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
    debugPrint('✅ Firebase initialized successfully');
  } catch (e) {
    debugPrint('⚠️ Firebase not configured: $e');
    debugPrint('Push notifications will be disabled');
  }

  // Initialize Google Mobile Ads SDK + fetch remote config — OFF critical path.
  // Splash doesn't show ads; SDK is ready long before user reaches a banner.
  // Previously awaited here, which added 1.5–3s to cold-start splash time.
  unawaited(
    AdService.initialize().then((_) {
      AdService.fetchConfig().then((_) {
        InterstitialAdService.preload();
      });
    }).catchError((e) => debugPrint('⚠️ AdMob init failed: $e')),
  );

  // Initialize notifications only if Firebase is available — OFF critical path.
  // FCM token registration in ThuloBazaarApp.initState already runs after
  // first frame, so channel/handler setup doesn't need to block runApp().
  if (_firebaseInitialized) {
    final notificationService = NotificationService();
    unawaited(
      notificationService.initialize().then((_) {
        notificationService.onNotificationTap = _handleNotificationTap;
        debugPrint('✅ Notifications initialized');
      }).catchError((e) => debugPrint('⚠️ Notifications init failed: $e')),
    );
  }

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

/// True once SplashScreen has handed off to MainNavScreen. Until then, deep-link
/// taps are stored and replayed later — otherwise the splash's
/// pushReplacement(MainNav) at ~2s replaces any screen we push too early during
/// a cold start (the cause of "tap chat push → lands on message list").
bool appReadyForDeepLinks = false;

/// Handle notification taps and navigate
void _handleNotificationTap(String? route, Map<String, dynamic>? data) {
  if (route == null) return;

  // Defer until MainNav is the base route (and navigator exists), so a
  // cold-start deep link isn't clobbered by the splash transition.
  if (!appReadyForDeepLinks || navigatorKey.currentState == null) {
    _pendingNotification = {'route': route, ...?data};
    return;
  }

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
          MaterialPageRoute(
            builder: (_) => AdDetailScreen(adId: adId),
          ),
        );
      }
      break;
    case '/verification':
      navigator.push(
        MaterialPageRoute(
          builder: (_) => const VerificationScreen(),
        ),
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

class ThuloBazaarApp extends StatefulWidget {
  const ThuloBazaarApp({super.key});

  @override
  State<ThuloBazaarApp> createState() => _ThuloBazaarAppState();
}

class _ThuloBazaarAppState extends State<ThuloBazaarApp> {
  @override
  void initState() {
    super.initState();
    // Register FCM token when user is logged in
    _registerNotificationToken();
    // Check for app updates
    _checkForAppUpdate();
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
          UpdateDialog.showSoftPrompt(ctx,
            storeUrl: result.storeUrl,
            latestVersion: result.latestVersion,
          );
        case UpdateType.forceUpdate:
          UpdateDialog.showForceScreen(ctx,
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
      // Process any notification that arrived before navigator/auth was ready
      processPendingNotification();
    }

    // Listen for auth changes
    authProvider.addListener(() {
      if (authProvider.isAuthenticated) {
        NotificationService().registerToken();
        notificationProvider.initialize();
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
