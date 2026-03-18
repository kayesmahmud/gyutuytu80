import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../api/api_config.dart';
import '../models/message.dart';

/// Socket.IO Service - manages real-time connection for messaging
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Connection state
  bool _isConnected = false;
  bool _isConnecting = false;
  String? _error;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;

  // Event controllers
  final _connectionController = StreamController<bool>.broadcast();
  final _messageController = StreamController<Message>.broadcast();
  final _messageEditedController = StreamController<Message>.broadcast();
  final _messageDeletedController = StreamController<int>.broadcast();
  final _typingStartController = StreamController<TypingUser>.broadcast();
  final _typingStopController = StreamController<TypingUser>.broadcast();
  final _conversationUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _userOnlineController = StreamController<int>.broadcast();
  final _userOfflineController = StreamController<int>.broadcast();
  final _errorController = StreamController<String>.broadcast();

  // Getters
  bool get isConnected => _isConnected;
  bool get isConnecting => _isConnecting;
  String? get error => _error;
  io.Socket? get socket => _socket;

  // Streams for listening to events
  Stream<bool> get connectionStream => _connectionController.stream;
  Stream<Message> get messageStream => _messageController.stream;
  Stream<Message> get messageEditedStream => _messageEditedController.stream;
  Stream<int> get messageDeletedStream => _messageDeletedController.stream;
  Stream<TypingUser> get typingStartStream => _typingStartController.stream;
  Stream<TypingUser> get typingStopStream => _typingStopController.stream;
  Stream<Map<String, dynamic>> get conversationUpdatedStream => _conversationUpdatedController.stream;
  Stream<int> get userOnlineStream => _userOnlineController.stream;
  Stream<int> get userOfflineStream => _userOfflineController.stream;
  Stream<String> get errorStream => _errorController.stream;

  /// Connect to the Socket.IO server
  Future<bool> connect() async {
    if (_isConnected || _isConnecting) return _isConnected;

    _isConnecting = true;
    _error = null;

    try {
      final token = await _storage.read(key: 'auth_token');
      if (token == null) {
        _error = 'No authentication token';
        _isConnecting = false;
        return false;
      }

      // Get base URL without trailing /api path (keep subdomain intact)
      final baseUrl = ApiConfig.baseUrl.replaceFirst(RegExp(r'/api$'), '');

      if (kDebugMode) developer.log('Connecting to $baseUrl', name: 'SocketService');
      if (kDebugMode) developer.log('Token: ${token.substring(0, 10)}...', name: 'SocketService');

      _socket = io.io(
        baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .setAuth({'token': token})
            .disableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(_maxReconnectAttempts)
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .build(),
      );

      // Register ALL event listeners BEFORE connecting to avoid race conditions
      _setupEventListeners();

      // Wait for connection or error
      final completer = Completer<bool>();
      Timer? timeout;

      void cleanup() {
        timeout?.cancel();
      }

      _socket!.onConnect((_) {
        if (!completer.isCompleted) {
          cleanup();
          completer.complete(true);
        }
      });

      _socket!.onConnectError((error) {
        if (!completer.isCompleted) {
          cleanup();
          completer.complete(false);
        }
      });

      timeout = Timer(const Duration(seconds: 10), () {
        if (!completer.isCompleted) {
          cleanup();
          completer.complete(false);
        }
      });

      // Connect AFTER all listeners are registered
      _socket!.connect();

      return await completer.future;
    } catch (e) {
      if (kDebugMode) developer.log('Connection error: $e', name: 'SocketService');
      _error = e.toString();
      _isConnecting = false;
      return false;
    }
  }

  void _setupEventListeners() {
    if (_socket == null) return;

    // Connection events
    _socket!.onConnect((_) {
      if (kDebugMode) developer.log('Connected to ${_socket?.io.uri}', name: 'SocketService');
      _isConnected = true;
      _isConnecting = false;
      _reconnectAttempts = 0;
      _error = null;
      _connectionController.add(true);
    });

    _socket!.onDisconnect((_) {
      if (kDebugMode) developer.log('Disconnected', name: 'SocketService');
      _isConnected = false;
      _connectionController.add(false);
    });

    _socket!.onConnectError((error) {
      if (kDebugMode) developer.log('Connection error: $error', name: 'SocketService');
      _error = error.toString();
      _isConnecting = false;
      _errorController.add(_error!);
    });

    _socket!.onReconnect((_) {
      if (kDebugMode) developer.log('Reconnecting...', name: 'SocketService');
      _reconnectAttempts++;
    });

    _socket!.onReconnectFailed((_) {
      if (kDebugMode) developer.log('Reconnect failed after $_maxReconnectAttempts attempts', name: 'SocketService');
      _error = 'Failed to reconnect';
      _errorController.add(_error!);
    });

    // Message events
    _socket!.on('message:new', (data) {
      if (kDebugMode) developer.log('New message received', name: 'SocketService');
      try {
        final message = Message.fromJson(data as Map<String, dynamic>);
        _messageController.add(message);
      } catch (e) {
        if (kDebugMode) developer.log('Error parsing message: $e', name: 'SocketService');
      }
    });

    _socket!.on('message:edited', (data) {
      if (kDebugMode) developer.log('Message edited', name: 'SocketService');
      try {
        final message = Message.fromJson(data as Map<String, dynamic>);
        _messageEditedController.add(message);
      } catch (e) {
        if (kDebugMode) developer.log('Error parsing edited message: $e', name: 'SocketService');
      }
    });

    _socket!.on('message:deleted', (data) {
      if (kDebugMode) developer.log('Message deleted', name: 'SocketService');
      try {
        final messageId = data['messageId'] as int? ?? data['id'] as int? ?? 0;
        _messageDeletedController.add(messageId);
      } catch (e) {
        if (kDebugMode) developer.log('Error parsing deleted message: $e', name: 'SocketService');
      }
    });

    // Typing events
    _socket!.on('typing:user-started', (data) {
      try {
        final user = TypingUser.fromJson(data as Map<String, dynamic>);
        _typingStartController.add(user);
      } catch (e) {
        if (kDebugMode) developer.log('Error parsing typing start: $e', name: 'SocketService');
      }
    });

    _socket!.on('typing:user-stopped', (data) {
      try {
        final user = TypingUser.fromJson(data as Map<String, dynamic>);
        _typingStopController.add(user);
      } catch (e) {
        if (kDebugMode) developer.log('Error parsing typing stop: $e', name: 'SocketService');
      }
    });

    // Conversation events
    _socket!.on('conversation:updated', (data) {
      if (kDebugMode) developer.log('Conversation updated', name: 'SocketService');
      try {
        _conversationUpdatedController.add(data as Map<String, dynamic>);
      } catch (e) {
        if (kDebugMode) developer.log('Error parsing conversation update: $e', name: 'SocketService');
      }
    });

    // Online/offline events — backend emits 'user:status' with {userId, isOnline}
    _socket!.on('user:status', (data) {
      final userId = data['userId'] as int? ?? 0;
      final isOnline = data['isOnline'] as bool? ?? false;
      if (isOnline) {
        _userOnlineController.add(userId);
      } else {
        _userOfflineController.add(userId);
      }
    });

    // Error events
    _socket!.on('error', (data) {
      final message = data['message'] as String? ?? 'Unknown error';
      if (kDebugMode) developer.log('Error: $message', name: 'SocketService');
      _errorController.add(message);
    });
  }

  // ==========================================
  // MESSAGE ACTIONS
  // ==========================================

  /// Send a message
  void sendMessage({
    required int conversationId,
    required String content,
    MessageType type = MessageType.text,
    String? attachmentUrl,
  }) {
    if (!_isConnected || _socket == null) {
      if (kDebugMode) developer.log('Cannot send message: not connected', name: 'SocketService');
      return;
    }

    _socket!.emit('message:send', {
      'conversationId': conversationId,
      'content': content,
      'type': type.name,
      if (attachmentUrl != null) 'attachmentUrl': attachmentUrl,
    });
  }

  /// Mark messages as read
  void markAsRead(int conversationId) {
    if (!_isConnected || _socket == null) return;

    _socket!.emit('message:read', {
      'conversationId': conversationId,
    });
  }

  /// Edit a message
  void editMessage({
    required int messageId,
    required String newContent,
    required int conversationId,
  }) {
    if (!_isConnected || _socket == null) return;

    _socket!.emit('message:edit', {
      'messageId': messageId,
      'content': newContent,
      'conversationId': conversationId,
    });
  }

  /// Delete a message
  void deleteMessage({
    required int messageId,
    required int conversationId,
  }) {
    if (!_isConnected || _socket == null) return;

    _socket!.emit('message:delete', {
      'messageId': messageId,
      'conversationId': conversationId,
    });
  }

  // ==========================================
  // TYPING INDICATORS
  // ==========================================

  /// Start typing indicator
  void startTyping(int conversationId) {
    if (!_isConnected || _socket == null) return;

    _socket!.emit('typing:start', {
      'conversationId': conversationId,
    });
  }

  /// Stop typing indicator
  void stopTyping(int conversationId) {
    if (!_isConnected || _socket == null) return;

    _socket!.emit('typing:stop', {
      'conversationId': conversationId,
    });
  }

  // ==========================================
  // CONVERSATION ACTIONS
  // ==========================================

  /// Create a new conversation
  void createConversation({
    required int participantId,
    int? adId,
  }) {
    if (!_isConnected || _socket == null) return;

    _socket!.emit('conversation:create', {
      'participantId': participantId,
      if (adId != null) 'adId': adId,
    });
  }

  /// Join a specific conversation room (retries once after connection if not yet connected)
  void joinConversation(int conversationId) {
    if (_isConnected && _socket != null) {
      _socket!.emit('room:join', {
        'room': 'conversation:$conversationId',
      });
    } else {
      // Socket not connected yet — join when connected
      if (kDebugMode) developer.log('Socket not connected, will join conversation:$conversationId on connect', name: 'SocketService');
      late final StreamSubscription<bool> sub;
      sub = connectionStream.listen((connected) {
        if (connected && _socket != null) {
          _socket!.emit('room:join', {
            'room': 'conversation:$conversationId',
          });
          sub.cancel();
        }
      });
    }
  }

  /// Leave a conversation room
  void leaveConversation(int conversationId) {
    if (!_isConnected || _socket == null) return;

    _socket!.emit('room:leave', {
      'room': 'conversation:$conversationId',
    });
  }

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================

  /// Disconnect from the server
  void disconnect() {
    if (kDebugMode) developer.log('Disconnecting...', name: 'SocketService');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
    _isConnecting = false;
    _connectionController.add(false);
  }

  /// Reconnect to the server
  Future<bool> reconnect() async {
    disconnect();
    return connect();
  }

  /// Dispose all resources
  void dispose() {
    disconnect();
    _connectionController.close();
    _messageController.close();
    _messageEditedController.close();
    _messageDeletedController.close();
    _typingStartController.close();
    _typingStopController.close();
    _conversationUpdatedController.close();
    _userOnlineController.close();
    _userOfflineController.close();
    _errorController.close();
  }
}
