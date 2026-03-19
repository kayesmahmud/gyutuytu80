import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'dio_client.dart';
import '../models/notification_item.dart';

/// API client for notification center endpoints
class NotificationClient {
  final Dio _dio = DioClient.instance.dio;

  Future<List<NotificationItem>> getNotifications({int page = 1, int limit = 20}) async {
    try {
      final response = await _dio.get('/notifications', queryParameters: {
        'page': page,
        'limit': limit,
      });
      final data = response.data;
      if (data['success'] == true && data['data'] != null) {
        return (data['data'] as List)
            .map((item) => NotificationItem.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      developer.log('Error fetching notifications: $e', name: 'NotificationClient');
      return [];
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/notifications/unread-count');
      final data = response.data;
      if (data['success'] == true) {
        return data['count'] as int? ?? 0;
      }
      return 0;
    } catch (e) {
      developer.log('Error fetching unread count: $e', name: 'NotificationClient');
      return 0;
    }
  }

  Future<bool> markAsRead(int notificationId) async {
    try {
      final response = await _dio.put('/notifications/$notificationId/read');
      return response.data['success'] == true;
    } catch (e) {
      developer.log('Error marking notification read: $e', name: 'NotificationClient');
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    try {
      final response = await _dio.put('/notifications/read-all');
      return response.data['success'] == true;
    } catch (e) {
      developer.log('Error marking all notifications read: $e', name: 'NotificationClient');
      return false;
    }
  }

  Future<bool> deleteNotification(int notificationId) async {
    try {
      final response = await _dio.delete('/notifications/$notificationId');
      return response.data['success'] == true;
    } catch (e) {
      developer.log('Error deleting notification: $e', name: 'NotificationClient');
      return false;
    }
  }
}
