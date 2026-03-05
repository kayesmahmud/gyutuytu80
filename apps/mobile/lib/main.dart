import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:marionette_flutter/marionette_flutter.dart';

import 'core/theme/app_theme.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/chat_provider.dart';
import 'core/services/notification_service.dart';
import 'core/services/ad_service.dart';
import 'features/main_nav/main_nav_screen.dart';

/// Global navigator key for notification navigation
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

/// Whether Firebase was initialized successfully
bool _firebaseInitialized = false;

void main() async {
  // Initialize Marionette for AI-assisted testing (debug only)
  if (kDebugMode) {
    MarionetteBinding.ensureInitialized();
  } else {
    WidgetsFlutterBinding.ensureInitialized();
  }

  // Initialize Firebase (optional - may not be configured in dev)
  try {
    await Firebase.initializeApp();
    _firebaseInitialized = true;
    debugPrint('✅ Firebase initialized successfully');
  } catch (e) {
    debugPrint('⚠️ Firebase not configured: $e');
    debugPrint('Push notifications will be disabled');
  }

  // Initialize Google Mobile Ads SDK + fetch remote config
  try {
    await AdService.initialize();
    AdService.fetchConfig(); // Non-blocking — fetches in background
  } catch (e) {
    debugPrint('⚠️ AdMob init failed: $e');
  }

  // Initialize notifications only if Firebase is available
  if (_firebaseInitialized) {
    try {
      final notificationService = NotificationService();
      await notificationService.initialize();
      notificationService.onNotificationTap = _handleNotificationTap;
      debugPrint('✅ Notifications initialized');
    } catch (e) {
      debugPrint('⚠️ Notifications init failed: $e');
    }
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: const ThuloBazaarApp(),
    ),
  );
}

/// Handle notification taps and navigate
void _handleNotificationTap(String? route, Map<String, dynamic>? data) {
  if (route == null || navigatorKey.currentState == null) return;

  // Navigate based on route
  switch (route) {
    case '/messages':
      navigatorKey.currentState?.pushNamed('/messages', arguments: data);
      break;
    case '/chat':
      final conversationId = data?['conversationId'] as int?;
      if (conversationId != null) {
        navigatorKey.currentState?.pushNamed('/chat', arguments: {
          'conversationId': conversationId,
          ...?data,
        });
      }
      break;
    case '/ad':
      final adId = data?['adId'] as int?;
      if (adId != null) {
        navigatorKey.currentState?.pushNamed('/ad', arguments: {
          'adId': adId,
          ...?data,
        });
      }
      break;
    case '/verification':
      navigatorKey.currentState?.pushNamed('/verification', arguments: data);
      break;
    case '/promotion':
      navigatorKey.currentState?.pushNamed('/promotion', arguments: data);
      break;
    default:
      // Navigate to default tab based on route
      break;
  }
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
  }

  Future<void> _registerNotificationToken() async {
    // Skip if Firebase is not initialized
    if (!_firebaseInitialized) return;

    // Wait for auth state to be ready
    await Future.delayed(const Duration(seconds: 1));

    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      NotificationService().registerToken();
    }

    // Listen for auth changes
    authProvider.addListener(() {
      if (authProvider.isAuthenticated) {
        NotificationService().registerToken();
      } else {
        NotificationService().unregisterToken();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Thulo Bazaar',
      theme: AppTheme.lightTheme,
      home: const MainNavScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

