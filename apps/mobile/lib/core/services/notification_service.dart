import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import '../api/api_config.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('[NotificationService] Background message: ${message.notification?.title}');
  // Handle background message if needed
}

/// Notification Service - handles push notifications
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Navigation callback for handling notification taps
  Function(String? route, Map<String, dynamic>? data)? onNotificationTap;

  // Stream controllers for notification events
  final _notificationController = StreamController<NotificationData>.broadcast();
  Stream<NotificationData> get notificationStream => _notificationController.stream;

  // Android notification channel
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'thulobazaar_notifications',
    'ThuluBazaar Notifications',
    description: 'ThuluBazaar app notifications',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Initialize the notification service
  Future<void> initialize() async {
    try {
      // Initialize Firebase
      await Firebase.initializeApp();

      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request permissions
      await _requestPermissions();

      // Initialize local notifications
      await _initLocalNotifications();

      // Get FCM token
      await _getToken();

      // Setup message handlers
      _setupMessageHandlers();

      print('[NotificationService] Initialized successfully');
    } catch (e) {
      print('[NotificationService] Initialization error: $e');
    }
  }

  /// Request notification permissions
  Future<bool> _requestPermissions() async {
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    print('[NotificationService] Permission status: ${settings.authorizationStatus}');

    if (Platform.isIOS) {
      await _firebaseMessaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    }

    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }

  /// Initialize local notifications
  Future<void> _initLocalNotifications() async {
    // Android initialization
    const androidSettings = AndroidInitializationSettings('@mipmap/launcher_icon');

    // iOS initialization
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
      onDidReceiveBackgroundNotificationResponse: _onBackgroundNotificationTap,
    );

    // Create Android notification channel
    if (Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);
    }
  }

  /// Handle notification tap
  void _onNotificationTap(NotificationResponse response) {
    print('[NotificationService] Notification tapped: ${response.payload}');
    _handleNotificationTap(response.payload);
  }

  /// Handle background notification tap (must be static or top-level)
  @pragma('vm:entry-point')
  static void _onBackgroundNotificationTap(NotificationResponse response) {
    print('[NotificationService] Background notification tapped: ${response.payload}');
    // Can't navigate directly here, but we can store the data
  }

  /// Process notification tap and navigate
  void _handleNotificationTap(String? payload) {
    if (payload == null) return;

    try {
      final data = json.decode(payload) as Map<String, dynamic>;
      final route = data['route'] as String?;
      final notificationData = Map<String, dynamic>.from(data)..remove('route');

      onNotificationTap?.call(route, notificationData);

      _notificationController.add(NotificationData(
        route: route,
        data: notificationData,
        type: NotificationType.tap,
      ));
    } catch (e) {
      print('[NotificationService] Error parsing notification payload: $e');
    }
  }

  /// Get FCM token
  Future<String?> _getToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      print('[NotificationService] FCM Token: $_fcmToken');

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('[NotificationService] FCM Token refreshed: $newToken');
        _fcmToken = newToken;
        _registerTokenWithServer(newToken);
      });

      return _fcmToken;
    } catch (e) {
      print('[NotificationService] Error getting FCM token: $e');
      return null;
    }
  }

  /// Setup Firebase message handlers
  void _setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // App opened from notification
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    // Check if app was opened from terminated state
    _checkInitialMessage();
  }

  /// Handle foreground message
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('[NotificationService] Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    final data = message.data;

    if (notification != null) {
      // Show local notification
      await showLocalNotification(
        title: notification.title ?? 'ThuluBazaar',
        body: notification.body ?? '',
        payload: json.encode({
          ...data,
          'route': data['route'],
        }),
      );
    }

    // Emit to stream
    _notificationController.add(NotificationData(
      title: notification?.title,
      body: notification?.body,
      data: data,
      type: NotificationType.foreground,
    ));
  }

  /// Handle notification open (from background)
  void _handleNotificationOpen(RemoteMessage message) {
    print('[NotificationService] App opened from notification: ${message.data}');

    final data = message.data;
    final route = data['route'] as String?;

    onNotificationTap?.call(route, data);

    _notificationController.add(NotificationData(
      title: message.notification?.title,
      body: message.notification?.body,
      data: data,
      route: route,
      type: NotificationType.open,
    ));
  }

  /// Check for initial message (app opened from terminated state)
  Future<void> _checkInitialMessage() async {
    final message = await _firebaseMessaging.getInitialMessage();
    if (message != null) {
      print('[NotificationService] Initial message: ${message.data}');
      // Delay to allow app to fully initialize
      await Future.delayed(const Duration(milliseconds: 500));
      _handleNotificationOpen(message);
    }
  }

  /// Show a local notification
  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
    int? id,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance: Importance.high,
      priority: Priority.high,
      playSound: true,
      icon: '@mipmap/launcher_icon',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Register FCM token with server
  Future<void> registerToken() async {
    if (_fcmToken == null) {
      await _getToken();
    }
    if (_fcmToken != null) {
      await _registerTokenWithServer(_fcmToken!);
    }
  }

  Future<void> _registerTokenWithServer(String token) async {
    try {
      final authToken = await _storage.read(key: 'auth_token');
      if (authToken == null) return;

      final dio = Dio(BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      ));

      await dio.post('/users/fcm-token', data: {
        'fcmToken': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
      });

      print('[NotificationService] FCM token registered with server');
    } catch (e) {
      print('[NotificationService] Error registering FCM token: $e');
    }
  }

  /// Unregister FCM token (for logout)
  Future<void> unregisterToken() async {
    if (_fcmToken == null) return;

    try {
      final authToken = await _storage.read(key: 'auth_token');
      if (authToken == null) return;

      final dio = Dio(BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      ));

      await dio.delete('/users/fcm-token', data: {
        'fcmToken': _fcmToken,
      });

      print('[NotificationService] FCM token unregistered from server');
    } catch (e) {
      print('[NotificationService] Error unregistering FCM token: $e');
    }
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
    print('[NotificationService] Subscribed to topic: $topic');
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    print('[NotificationService] Unsubscribed from topic: $topic');
  }

  /// Clear all notifications
  Future<void> clearAll() async {
    await _localNotifications.cancelAll();
  }

  /// Dispose resources
  void dispose() {
    _notificationController.close();
  }
}

/// Notification type
enum NotificationType {
  foreground,
  background,
  tap,
  open,
}

/// Notification data wrapper
class NotificationData {
  final String? title;
  final String? body;
  final Map<String, dynamic>? data;
  final String? route;
  final NotificationType type;

  NotificationData({
    this.title,
    this.body,
    this.data,
    this.route,
    required this.type,
  });
}
