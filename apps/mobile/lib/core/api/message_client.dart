import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
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
      print('DEBUG [MessageClient.getMessages] Fetching /messages/conversations/$conversationId');
      final response = await _dio.get('/messages/conversations/$conversationId');

      print('DEBUG [MessageClient.getMessages] Status: ${response.statusCode}, success: ${response.data['success']}');

      if (response.data['success'] == true) {
        // Express returns { data: { conversation, messages } }
        final responseData = response.data['data'];
        List<dynamic> messagesList;

        if (responseData is Map && responseData.containsKey('messages')) {
          messagesList = responseData['messages'] as List<dynamic>;
          print('DEBUG [MessageClient.getMessages] Found ${messagesList.length} messages in data.messages');
        } else if (responseData is List) {
          messagesList = responseData;
          print('DEBUG [MessageClient.getMessages] Found ${messagesList.length} messages in data (array)');
        } else {
          messagesList = [];
          print('DEBUG [MessageClient.getMessages] WARNING: data format unrecognized: ${responseData.runtimeType}');
        }

        final messages = messagesList
            .map((e) => Message.fromJson(e as Map<String, dynamic>))
            .toList();
        print('DEBUG [MessageClient.getMessages] Parsed ${messages.length} messages. Last content: ${messages.isNotEmpty ? messages.last.content : "EMPTY"}');
        return ApiResponse.success(messages);
      }
      print('DEBUG [MessageClient.getMessages] API returned success=false: ${response.data}');
      return ApiResponse.failure(response.data['error'] ?? 'Failed to fetch messages');
    } on DioException catch (e) {
      print('DEBUG [MessageClient.getMessages] DioException: ${e.type} ${e.message} ${e.response?.statusCode}');
      print('DEBUG [MessageClient.getMessages] Underlying error: ${e.error}');
      print('DEBUG [MessageClient.getMessages] Stack: ${e.stackTrace}');
      return ApiResponse.failure(
        e.response?.data?['error'] ?? 'Failed to fetch messages',
      );
    } catch (e) {
      print('DEBUG [MessageClient.getMessages] Unexpected error: $e');
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
      print('Upload Error: ${e.message}');
      print('Upload Response: ${e.response?.data}');
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
      print('Error fetching unread count: $e');
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
