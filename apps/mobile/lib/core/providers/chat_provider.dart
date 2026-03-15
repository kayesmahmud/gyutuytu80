import 'dart:async';
import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';
import '../api/message_client.dart';
import '../models/message.dart';
import '../services/socket_service.dart';

/// Chat Provider - manages messaging state with Socket.IO integration
class ChatProvider extends ChangeNotifier {
  final MessageClient _messageClient = MessageClient();
  final SocketService _socketService = SocketService();

  // State
  List<Conversation> _conversations = [];
  Map<int, List<Message>> _messagesByConversation = {};
  final Map<int, bool> _hasMoreMessages = {};
  final Map<int, int> _messagePages = {};
  static const int _messagesPerPage = 50;
  Set<int> _onlineUsers = {};
  Map<int, Set<int>> _typingUsers = {}; // conversationId -> typing userIds
  int _unreadCount = 0;
  bool _isLoading = false;
  bool _isConnected = false;
  String? _error;
  int? _currentUserId;

  // Announcements state
  List<Announcement> _announcements = [];
  bool _announcementsLoading = false;

  // Subscriptions
  final List<StreamSubscription> _subscriptions = [];

  // Getters
  List<Conversation> get conversations => _conversations;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  bool get isConnected => _isConnected;
  String? get error => _error;
  List<Announcement> get announcements => _announcements;
  bool get announcementsLoading => _announcementsLoading;
  int get unreadAnnouncementsCount => _announcements.where((a) => !a.isRead).length;

  List<Message> getMessages(int conversationId) {
    return _messagesByConversation[conversationId] ?? [];
  }

  bool hasMoreMessages(int conversationId) {
    return _hasMoreMessages[conversationId] ?? true;
  }

  bool isUserOnline(int userId) => _onlineUsers.contains(userId);

  List<int> getTypingUsers(int conversationId) {
    return _typingUsers[conversationId]?.toList() ?? [];
  }

  /// Initialize the chat provider with user info
  Future<void> initialize(int userId) async {
    _currentUserId = userId;

    // Connect to Socket.IO
    await _connectSocket();

    // Load initial data
    await loadConversations();
    await loadUnreadCount();
  }

  Future<void> _connectSocket() async {
    // Setup listeners first to capture any state changes
    _setupSocketListeners();
    
    // Check current state
    _isConnected = _socketService.isConnected;
    notifyListeners();

    // Attempt connection
    final connected = await _socketService.connect();
    _isConnected = connected;
    notifyListeners();
  }

  void _setupSocketListeners() {
    // Connection status
    _subscriptions.add(
      _socketService.connectionStream.listen((connected) {
        _isConnected = connected;
        notifyListeners();
      }),
    );

    // New messages
    _subscriptions.add(
      _socketService.messageStream.listen(_handleNewMessage),
    );

    // Edited messages
    _subscriptions.add(
      _socketService.messageEditedStream.listen(_handleMessageEdited),
    );

    // Deleted messages
    _subscriptions.add(
      _socketService.messageDeletedStream.listen(_handleMessageDeleted),
    );

    // Typing indicators
    _subscriptions.add(
      _socketService.typingStartStream.listen(_handleTypingStart),
    );
    _subscriptions.add(
      _socketService.typingStopStream.listen(_handleTypingStop),
    );

    // Conversation updates
    _subscriptions.add(
      _socketService.conversationUpdatedStream.listen(_handleConversationUpdated),
    );

    // Online status
    _subscriptions.add(
      _socketService.userOnlineStream.listen((userId) {
        _onlineUsers.add(userId);
        notifyListeners();
      }),
    );
    _subscriptions.add(
      _socketService.userOfflineStream.listen((userId) {
        _onlineUsers.remove(userId);
        notifyListeners();
      }),
    );

    // Errors
    _subscriptions.add(
      _socketService.errorStream.listen((error) {
        _error = error;
        notifyListeners();
      }),
    );
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  void _handleNewMessage(Message message) {
    final conversationId = message.conversationId;
    if (conversationId == null) return;

    // Skip own messages - already added via optimistic update in sendMessage()
    if (message.senderId == _currentUserId) return;

    // Add to messages list
    if (_messagesByConversation[conversationId] == null) {
      _messagesByConversation[conversationId] = [];
    }
    _messagesByConversation[conversationId]!.insert(0, message);

    // Update conversation list
    final index = _conversations.indexWhere((c) => c.id == conversationId);
    if (index >= 0) {
      final conversation = _conversations[index];
      final updated = conversation.copyWith(
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
        unreadCount: message.senderId != _currentUserId
            ? conversation.unreadCount + 1
            : conversation.unreadCount,
      );
      _conversations.removeAt(index);
      _conversations.insert(0, updated); // Move to top
    }

    // Update unread count if not from current user
    if (message.senderId != _currentUserId) {
      _unreadCount++;
    }

    notifyListeners();
  }

  void _handleMessageEdited(Message message) {
    final conversationId = message.conversationId;
    if (conversationId == null) return;

    final messages = _messagesByConversation[conversationId];
    if (messages == null) return;

    final index = messages.indexWhere((m) => m.id == message.id);
    if (index >= 0) {
      messages[index] = message;
      notifyListeners();
    }
  }

  void _handleMessageDeleted(int messageId) {
    for (final entry in _messagesByConversation.entries) {
      final index = entry.value.indexWhere((m) => m.id == messageId);
      if (index >= 0) {
        entry.value[index] = entry.value[index].copyWith(isDeleted: true);
        notifyListeners();
        break;
      }
    }
  }

  void _handleTypingStart(TypingUser user) {
    if (user.id == _currentUserId) return;

    _typingUsers[user.conversationId] ??= {};
    _typingUsers[user.conversationId]!.add(user.id);
    notifyListeners();
  }

  void _handleTypingStop(TypingUser user) {
    _typingUsers[user.conversationId]?.remove(user.id);
    notifyListeners();
  }

  void _handleConversationUpdated(Map<String, dynamic> data) {
    final conversationId = data['conversationId'] as int?;
    if (conversationId == null) return;

    final index = _conversations.indexWhere((c) => c.id == conversationId);
    if (index >= 0) {
      final lastMessage = data['lastMessage'];
      if (lastMessage != null) {
        final message = Message.fromJson(lastMessage as Map<String, dynamic>);
        final updated = _conversations[index].copyWith(
          lastMessage: message.content,
          lastMessageAt: message.createdAt,
        );
        _conversations[index] = updated;
        notifyListeners();
      }
    }
  }

  // ==========================================
  // API METHODS (REST)
  // ==========================================

  /// Load all conversations
  Future<void> loadConversations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _messageClient.getConversations();

    _isLoading = false;
    if (response.success && response.data != null) {
      _conversations = response.data!;
      // Sort by most recent
      _conversations.sort((a, b) => b.lastMessageAt.compareTo(a.lastMessageAt));
    } else {
      _error = response.errorMessage;
    }
    notifyListeners();
  }

  /// Load messages for a conversation (first page)
  Future<void> loadMessages(int conversationId) async {
    _messagePages[conversationId] = 1;
    final response = await _messageClient.getMessages(conversationId, page: 1, limit: _messagesPerPage);

    if (response.success && response.data != null) {
      _messagesByConversation[conversationId] = response.data!;
      _hasMoreMessages[conversationId] = response.data!.length >= _messagesPerPage;
      notifyListeners();
    } else {
      if (kDebugMode) developer.log('Failed to load messages: ${response.error}', name: 'ChatProvider');
    }
  }

  /// Load older messages for a conversation (pagination)
  Future<void> loadMoreMessages(int conversationId) async {
    if (!(_hasMoreMessages[conversationId] ?? true)) return;

    final nextPage = (_messagePages[conversationId] ?? 1) + 1;
    final response = await _messageClient.getMessages(conversationId, page: nextPage, limit: _messagesPerPage);

    if (response.success && response.data != null) {
      _messagesByConversation[conversationId] ??= [];
      _messagesByConversation[conversationId]!.addAll(response.data!);
      _messagePages[conversationId] = nextPage;
      _hasMoreMessages[conversationId] = response.data!.length >= _messagesPerPage;
      notifyListeners();
    }
  }

  /// Load unread count
  Future<void> loadUnreadCount() async {
    _unreadCount = await _messageClient.getUnreadCount();
    notifyListeners();
  }

  // ==========================================
  // SENDING MESSAGES
  // ==========================================

  /// Send a message (uses Socket.IO if connected, falls back to REST)
  Future<bool> sendMessage({
    required int conversationId,
    required String content,
    MessageType type = MessageType.text,
    String? attachmentUrl,
  }) async {
    if (_isConnected) {
      // Optimistic update
      final tempMessage = Message(
        id: DateTime.now().millisecondsSinceEpoch, // Temp ID
        conversationId: conversationId,
        senderId: _currentUserId!,
        content: content,
        type: type,
        isRead: false,
        createdAt: DateTime.now(),
        attachmentUrl: attachmentUrl,
        sender: MessageSender(id: _currentUserId!, name: 'Me', avatar: ''), // Placeholder
      );

      _messagesByConversation[conversationId] ??= [];
      _messagesByConversation[conversationId]!.insert(0, tempMessage);

      // Optimistic conversation list update
      final index = _conversations.indexWhere((c) => c.id == conversationId);
      if (index >= 0) {
        final conversation = _conversations[index];
        final updated = conversation.copyWith(
          lastMessage: type == MessageType.image ? '📷 Image' : content,
          lastMessageAt: DateTime.now(),
        );
        _conversations.removeAt(index);
        _conversations.insert(0, updated);
      } else {
        // Conversation not in list (new?), reload to be safe
        loadConversations();
      }
      notifyListeners();

      // Use Socket.IO
      _socketService.sendMessage(
        conversationId: conversationId,
        content: content,
        type: type,
        attachmentUrl: attachmentUrl,
      );
      return true;
    } else {
      // Fallback to REST API
      final response = await _messageClient.sendMessage(
        conversationId: conversationId,
        message: content,
        type: type.name,
        attachmentUrl: attachmentUrl,
      );

      if (response.success && response.data != null) {
        // Add to local messages
        _messagesByConversation[conversationId] ??= [];
        _messagesByConversation[conversationId]!.insert(0, response.data!);
        notifyListeners();
        return true;
      }
      return false;
    }
  }

  /// Create or get conversation with a user
  Future<Conversation?> getOrCreateConversation({
    required int participantId,
    int? adId,
  }) async {
    // Prevent self-messaging
    if (_currentUserId != null && participantId == _currentUserId) {
      _error = 'You cannot message yourself';
      notifyListeners();
      return null;
    }

    // Check if conversation already exists
    final existing = _conversations.firstWhere(
      (c) => c.otherUserId == participantId && (adId == null || c.adId == adId),
      orElse: () => Conversation(
        id: -1,
        otherUserId: 0,
        otherUserName: '',
        lastMessage: '',
        lastMessageAt: DateTime.now(),
        unreadCount: 0,
      ),
    );

    if (existing.id != -1) return existing;

    // Create new conversation
    final response = await _messageClient.createConversation(
      participantId: participantId,
      adId: adId,
    );

    if (response.success && response.data != null) {
      _conversations.insert(0, response.data!);
      notifyListeners();
      return response.data;
    }
    return null;
  }

  // ==========================================
  // TYPING INDICATORS
  // ==========================================

  Timer? _typingTimer;

  /// Start typing indicator (auto-stops after 3 seconds)
  void startTyping(int conversationId) {
    _typingTimer?.cancel();
    _socketService.startTyping(conversationId);

    _typingTimer = Timer(const Duration(seconds: 3), () {
      stopTyping(conversationId);
    });
  }

  /// Stop typing indicator
  void stopTyping(int conversationId) {
    _typingTimer?.cancel();
    _socketService.stopTyping(conversationId);
  }

  // ==========================================
  // MESSAGE ACTIONS
  // ==========================================

  /// Mark conversation as read
  Future<void> markAsRead(int conversationId) async {
    if (_isConnected) {
      _socketService.markAsRead(conversationId);
    } else {
      await _messageClient.markAsRead(conversationId);
    }

    // Update local state
    final index = _conversations.indexWhere((c) => c.id == conversationId);
    if (index >= 0) {
      final unread = _conversations[index].unreadCount;
      _conversations[index] = _conversations[index].copyWith(unreadCount: 0);
      _unreadCount = (_unreadCount - unread).clamp(0, double.maxFinite.toInt());
      notifyListeners();
    }
  }

  /// Edit a message
  void editMessage({
    required int messageId,
    required String newContent,
    required int conversationId,
  }) {
    _socketService.editMessage(
      messageId: messageId,
      newContent: newContent,
      conversationId: conversationId,
    );
  }

  /// Delete a message
  void deleteMessage({
    required int messageId,
    required int conversationId,
  }) {
    _socketService.deleteMessage(
      messageId: messageId,
      conversationId: conversationId,
    );
  }

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  /// Load announcements
  Future<void> loadAnnouncements() async {
    _announcementsLoading = true;
    notifyListeners();

    final response = await _messageClient.getAnnouncements(includeRead: true);
    _announcementsLoading = false;

    if (response.success && response.data != null) {
      _announcements = response.data!;
    }
    notifyListeners();
  }

  /// Mark announcement as read
  Future<void> markAnnouncementRead(int announcementId) async {
    final response = await _messageClient.markAnnouncementRead(announcementId);
    if (response.success) {
      final index = _announcements.indexWhere((a) => a.id == announcementId);
      if (index >= 0) {
        _announcements[index] = _announcements[index].copyWith(
          isRead: true,
          readAt: DateTime.now(),
        );
        notifyListeners();
      }
    }
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================

  /// Reconnect to Socket.IO
  Future<void> reconnect() async {
    await _socketService.reconnect();
    await loadConversations();
  }

  /// Disconnect from Socket.IO
  void disconnect() {
    _socketService.disconnect();
    _isConnected = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    _subscriptions.clear();
    // Don't dispose the singleton socket service
    super.dispose();
  }
}
