import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import 'api_config.dart';

/// Message API Client - handles all messaging-related API calls
class MessageClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: ApiConfig.connectTimeout,
    receiveTimeout: ApiConfig.receiveTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  MessageClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("MessageClient Error: ${e.message}");
        return handler.next(e);
      },
    ));
  }

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  /// Get all conversations for the current user
  Future<ApiResponse<List<Conversation>>> getConversations() async {
    try {
      final response = await _dio.get('/messages/conversations');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final conversations = data
            .map((e) => Conversation.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(conversations);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to fetch conversations');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch conversations',
      );
    }
  }

  /// Create or get existing conversation
  Future<ApiResponse<Conversation>> createConversation({
    required int participantId,
    int? adId,
  }) async {
    try {
      final response = await _dio.post('/messages/conversations', data: {
        'participantId': participantId,
        if (adId != null) 'adId': adId,
      });

      if (response.data['success'] == true) {
        return ApiResponse.success(
          Conversation.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to create conversation');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to create conversation',
      );
    }
  }

  // ==========================================
  // MESSAGES
  // ==========================================

  /// Get messages for a conversation
  Future<ApiResponse<List<Message>>> getMessages(int conversationId) async {
    try {
      final response = await _dio.get('/messages/$conversationId');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final messages = data
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(messages);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to fetch messages');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch messages',
      );
    }
  }

  /// Send a message
  Future<ApiResponse<Message>> sendMessage({
    required int recipientId,
    required String message,
    int? adId,
  }) async {
    try {
      final response = await _dio.post('/messages', data: {
        'recipient_id': recipientId,
        'message': message,
        if (adId != null) 'ad_id': adId,
      });

      if (response.data['success'] == true) {
        return ApiResponse.success(
          Message.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to send message');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to send message',
      );
    }
  }

  /// Mark messages as read
  Future<ApiResponse<void>> markAsRead(int conversationId) async {
    try {
      final response = await _dio.post('/messages/$conversationId/read');

      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to mark as read');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to mark as read',
      );
    }
  }

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  /// Get unread message count
  Future<int> getUnreadCount() async {
    try {
      final response = await _dio.get('/messages/unread-count');

      if (response.data['success'] == true) {
        return response.data['data']['unread_messages'] as int? ??
            response.data['data']['unreadMessages'] as int? ??
            response.data['data']['count'] as int? ??
            0;
      }
      return 0;
    } on DioException catch (e) {
      print('Error fetching unread count: $e');
      return 0;
    }
  }

  // ==========================================
  // CONTACT MESSAGES (Legacy)
  // ==========================================

  /// Get sent messages
  Future<ApiResponse<List<Message>>> getSentMessages() async {
    try {
      final response = await _dio.get('/contact-messages/sent');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final messages = data
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(messages);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to fetch messages');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch messages',
      );
    }
  }

  /// Get received messages
  Future<ApiResponse<List<Message>>> getReceivedMessages() async {
    try {
      final response = await _dio.get('/contact-messages/received');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final messages = data
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(messages);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to fetch messages');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch messages',
      );
    }
  }
}
