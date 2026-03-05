import 'dart:developer' as developer;
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:http_parser/http_parser.dart';
import '../models/models.dart';
import 'dio_client.dart';

/// Message API Client - handles all messaging-related API calls
class MessageClient {
  final Dio _dio;

  MessageClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

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

  /// Get messages for a conversation with pagination
  Future<ApiResponse<List<Message>>> getMessages(int conversationId, {int page = 1, int limit = 50}) async {
    try {
      final response = await _dio.get(
        '/messages/conversations/$conversationId',
        queryParameters: {'page': page, 'limit': limit},
      );

      if (response.data['success'] == true) {
        // Express returns { data: { conversation, messages } }
        final responseData = response.data['data'];
        List<dynamic> messagesList;

        if (responseData is Map && responseData.containsKey('messages')) {
          messagesList = responseData['messages'] as List<dynamic>;
        } else if (responseData is List) {
          messagesList = responseData;
        } else {
          messagesList = [];
          if (kDebugMode) developer.log('Unrecognized data format: ${responseData.runtimeType}', name: 'MessageClient');
        }

        final messages = messagesList
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(messages);
      }
      return ApiResponse.failure(response.data['error'] ?? 'Failed to fetch messages');
    } on DioException catch (e) {
      if (kDebugMode) developer.log('getMessages error: ${e.type} ${e.message}', name: 'MessageClient');
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch messages',
      );
    } catch (e) {
      if (kDebugMode) developer.log('getMessages unexpected: $e', name: 'MessageClient');
      return ApiResponse.failure('Unexpected error: $e');
    }
  }

  /// Send a message via REST (fallback when Socket.IO is down)
  Future<ApiResponse<Message>> sendMessage({
    required int conversationId,
    required String message,
    String type = 'text',
    String? attachmentUrl,
    // Legacy params (unused with conversation-based API)
    int? recipientId,
    int? adId,
  }) async {
    try {
      final response = await _dio.post(
        '/messages/conversations/$conversationId/messages',
        data: {
          'content': message,
          'type': type,
          if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
        },
      );

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

  /// Mark messages as read via REST
  Future<ApiResponse<void>> markAsRead(int conversationId) async {
    try {
      // Reading the conversation already updates last_read_at on the backend
      final response = await _dio.get('/messages/conversations/$conversationId?limit=1');
      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure('Failed to mark as read');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to mark as read',
      );
    }
  }

  // ==========================================
  // IMAGE UPLOAD
  // ==========================================

  /// Upload an image for messaging
  Future<ApiResponse<String>> uploadImage(File imageFile) async {
    try {
      final String fileName = imageFile.path.split('/').last;
      String mimeType = 'image/jpeg';
      final ext = fileName.split('.').last.toLowerCase();
      
      if (ext == 'png') mimeType = 'image/png';
      else if (ext == 'gif') mimeType = 'image/gif';
      else if (ext == 'webp') mimeType = 'image/webp';

      final formData = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          imageFile.path,
          filename: fileName,
          contentType: MediaType.parse(mimeType),
        ),
      });

      final response = await _dio.post('/messages/upload', data: formData);

      if (response.data['success'] == true) {
        final url = response.data['data']['url'] as String;
        return ApiResponse.success(url);
      }
      return ApiResponse.failure('Failed to upload image');
    } on DioException catch (e) {
      if (kDebugMode) developer.log('Upload error: ${e.message}', name: 'MessageClient');
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to upload image',
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
      if (kDebugMode) developer.log('Error fetching unread count: $e', name: 'MessageClient');
      return 0;
    }
  }

  // ==========================================
  // SEARCH USERS
  // ==========================================

  /// Search users for starting new conversations
  Future<ApiResponse<List<SearchUser>>> searchUsers(String query) async {
    try {
      final response = await _dio.get('/messages/search-users', queryParameters: {'q': query});

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final users = data
            .map((e) => SearchUser.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(users);
      }
      return ApiResponse.failure('Failed to search users');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to search users',
      );
    }
  }

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  /// Get announcements
  Future<ApiResponse<List<Announcement>>> getAnnouncements({bool includeRead = true}) async {
    try {
      final response = await _dio.get(
        '/announcements',
        queryParameters: {'includeRead': includeRead.toString()},
      );

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final announcements = data
            .map((e) => Announcement.fromJson(e as Map<String, dynamic>))
            .toList();
        return ApiResponse.success(announcements);
      }
      return ApiResponse.failure('Failed to fetch announcements');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch announcements',
      );
    }
  }

  /// Mark announcement as read
  Future<ApiResponse<void>> markAnnouncementRead(int announcementId) async {
    try {
      final response = await _dio.post('/announcements/$announcementId/read');
      if (response.data['success'] == true) {
        return ApiResponse.success(null);
      }
      return ApiResponse.failure('Failed to mark announcement as read');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to mark as read',
      );
    }
  }
}
