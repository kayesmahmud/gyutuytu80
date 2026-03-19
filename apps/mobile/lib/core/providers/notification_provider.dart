import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import '../api/notification_client.dart';
import '../models/notification_item.dart';
import '../services/socket_service.dart';

/// Provider for notification center state management.
/// Mirrors the ChatProvider pattern using ChangeNotifier.
class NotificationProvider extends ChangeNotifier {
  final NotificationClient _client = NotificationClient();
  final SocketService _socket = SocketService();

  List<NotificationItem> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 1;
  StreamSubscription<dynamic>? _socketSub;

  List<NotificationItem> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;

  /// Initialize — fetch unread count and listen for real-time updates
  Future<void> initialize() async {
    await fetchUnreadCount();
    _listenToSocket();
  }

  /// Fetch unread count (for badge)
  Future<void> fetchUnreadCount() async {
    _unreadCount = await _client.getUnreadCount();
    notifyListeners();
  }

  /// Fetch notifications (paginated)
  Future<void> fetchNotifications({bool refresh = false}) async {
    if (_isLoading) return;

    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _notifications = [];
    }

    if (!_hasMore) return;

    _isLoading = true;
    notifyListeners();

    try {
      final items = await _client.getNotifications(page: _currentPage, limit: 20);
      if (items.isEmpty) {
        _hasMore = false;
      } else {
        _notifications.addAll(items);
        _currentPage++;
      }
    } catch (e) {
      developer.log('Error fetching notifications: $e', name: 'NotificationProvider');
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Mark single notification as read
  Future<void> markAsRead(int notificationId) async {
    final success = await _client.markAsRead(notificationId);
    if (success) {
      final idx = _notifications.indexWhere((n) => n.id == notificationId);
      if (idx != -1 && !_notifications[idx].isRead) {
        _notifications[idx] = _notifications[idx].copyWith(
          isRead: true,
          readAt: DateTime.now(),
        );
        _unreadCount = (_unreadCount - 1).clamp(0, _unreadCount);
        notifyListeners();
      }
    }
  }

  /// Mark all as read
  Future<void> markAllAsRead() async {
    final success = await _client.markAllAsRead();
    if (success) {
      _notifications = _notifications
          .map((n) => n.isRead ? n : n.copyWith(isRead: true, readAt: DateTime.now()))
          .toList();
      _unreadCount = 0;
      notifyListeners();
    }
  }

  /// Delete a notification
  Future<void> deleteNotification(int notificationId) async {
    final success = await _client.deleteNotification(notificationId);
    if (success) {
      final wasUnread = _notifications.any((n) => n.id == notificationId && !n.isRead);
      _notifications.removeWhere((n) => n.id == notificationId);
      if (wasUnread) {
        _unreadCount = (_unreadCount - 1).clamp(0, _unreadCount);
      }
      notifyListeners();
    }
  }

  /// Listen to socket `notification:new` events for real-time updates
  void _listenToSocket() {
    final socket = _socket.socket;
    if (socket == null) return;

    socket.on('notification:new', (data) {
      try {
        final payload = data as Map<String, dynamic>;
        final notifData = payload['notification'] as Map<String, dynamic>?;
        final count = payload['unreadCount'] as int?;

        if (notifData != null) {
          final item = NotificationItem.fromJson(notifData);
          // Add to top of list if notifications are loaded
          _notifications.insert(0, item);
        }

        if (count != null) {
          _unreadCount = count;
        } else {
          _unreadCount++;
        }

        notifyListeners();
      } catch (e) {
        developer.log('Error parsing notification socket event: $e',
            name: 'NotificationProvider');
      }
    });
  }

  /// Clean up
  void reset() {
    _notifications = [];
    _unreadCount = 0;
    _currentPage = 1;
    _hasMore = true;
    _isLoading = false;
    _socketSub?.cancel();
    notifyListeners();
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    super.dispose();
  }
}
