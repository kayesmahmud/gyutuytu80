import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../api/dio_client.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  if (kDebugMode) developer.log('Background message: ${message.notification?.title}', name: 'NotificationService');
  // Handle background message if needed
}

/// Notification Service - handles push notifications
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  // Navigation callback for handling notification taps
  Function(String? route, Map<String, dynamic>? data)? onNotificationTap;

  // Stream controllers for notification events
  final _notificationController = StreamController<NotificationData>.broadcast();
  Stream<NotificationData> get notificationStream => _notificationController.stream;

  // Guard against duplicate listener setup
  bool _handlersSetup = false;
  StreamSubscription<RemoteMessage>? _foregroundSub;
  StreamSubscription<RemoteMessage>? _messageOpenSub;

  // Android notification channel
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'thulobazaar_notifications',
    'Thulo Bazaar Notifications',
    description: 'Thulo Bazaar app notifications',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  /// Currently active conversation ID — set by chat screen to suppress
  /// foreground notifications for the conversation the user is already viewing.
  int? _activeConversationId;
  void setActiveConversation(int? conversationId) {
    _activeConversationId = conversationId;
  }

  /// Initialize the notification service
  Future<void> initialize() async {
    try {
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

      if (kDebugMode) developer.log('Initialized successfully', name: 'NotificationService');
    } catch (e) {
      if (kDebugMode) developer.log('Initialization error: $e', name: 'NotificationService');
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

    if (kDebugMode) developer.log('Permission status: ${settings.authorizationStatus}', name: 'NotificationService');

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
    if (kDebugMode) developer.log('Notification tapped: ${response.payload}', name: 'NotificationService');
    _handleNotificationTap(response.payload);
  }

  /// Handle background notification tap (must be static or top-level)
  @pragma('vm:entry-point')
  static void _onBackgroundNotificationTap(NotificationResponse response) {
    if (kDebugMode) developer.log('Background notification tapped: ${response.payload}', name: 'NotificationService');
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
      if (kDebugMode) developer.log('Error parsing notification payload: $e', name: 'NotificationService');
    }
  }

  /// Get FCM token
  Future<String?> _getToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      if (kDebugMode) developer.log('FCM Token: $_fcmToken', name: 'NotificationService');

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        if (kDebugMode) developer.log('FCM Token refreshed: $newToken', name: 'NotificationService');
        _fcmToken = newToken;
        _registerTokenWithServer(newToken);
      });

      return _fcmToken;
    } catch (e) {
      if (kDebugMode) developer.log('Error getting FCM token: $e', name: 'NotificationService');
      return null;
    }
  }

  /// Setup Firebase message handlers
  void _setupMessageHandlers() {
    if (_handlersSetup) return;
    _handlersSetup = true;

    // Foreground messages
    _foregroundSub = FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // App opened from notification
    _messageOpenSub = FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationOpen);

    // Check if app was opened from terminated state
    _checkInitialMessage();
  }

  /// Handle foreground message
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    if (kDebugMode) developer.log('Foreground message: ${message.notification?.title}', name: 'NotificationService');

    final notification = message.notification;
    final data = message.data;

    // Suppress notification if user is currently viewing this conversation
    final messageConversationId = int.tryParse(data['conversationId'] ?? '');
    final isActiveConversation =
        messageConversationId != null && messageConversationId == _activeConversationId;

    if (notification != null && !isActiveConversation) {
      await showLocalNotification(
        title: notification.title ?? 'Thulo Bazaar',
        body: notification.body ?? '',
        payload: json.encode({
          ...data,
          'route': data['route'],
        }),
      );
    }

    // Always emit to stream (for in-app state updates even if notification is suppressed)
    _notificationController.add(NotificationData(
      title: notification?.title,
      body: notification?.body,
      data: data,
      type: NotificationType.foreground,
    ));
  }

  /// Handle notification open (from background)
  void _handleNotificationOpen(RemoteMessage message) {
    if (kDebugMode) developer.log('App opened from notification: ${message.data}', name: 'NotificationService');

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
      if (kDebugMode) developer.log('Initial message: ${message.data}', name: 'NotificationService');
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
      await DioClient.instance.dio.post('/users/fcm-token', data: {
        'fcmToken': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
      });

      if (kDebugMode) developer.log('FCM token registered with server', name: 'NotificationService');
    } catch (e) {
      if (kDebugMode) developer.log('Error registering FCM token: $e', name: 'NotificationService');
    }
  }

  /// Unregister FCM token (for logout)
  Future<void> unregisterToken() async {
    if (_fcmToken == null) return;

    try {
      await DioClient.instance.dio.delete('/users/fcm-token', data: {
        'fcmToken': _fcmToken,
      });

      if (kDebugMode) developer.log('FCM token unregistered from server', name: 'NotificationService');
    } catch (e) {
      if (kDebugMode) developer.log('Error unregistering FCM token: $e', name: 'NotificationService');
    }
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
    if (kDebugMode) developer.log('Subscribed to topic: $topic', name: 'NotificationService');
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    if (kDebugMode) developer.log('Unsubscribed from topic: $topic', name: 'NotificationService');
  }

  /// Clear all notifications
  Future<void> clearAll() async {
    await _localNotifications.cancelAll();
  }

  /// Dispose resources
  void dispose() {
    _foregroundSub?.cancel();
    _messageOpenSub?.cancel();
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
