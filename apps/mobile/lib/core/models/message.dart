/// Message models - mirrors @thulobazaar/types Message interfaces

enum MessageType { text, image, file }

/// Single Message model (supports both REST and Socket.IO formats)
class Message {
  final int id;
  final int? conversationId;
  final int senderId;
  final int? recipientId;
  final int? adId;
  final String content; // renamed from 'message' to match Socket.IO
  final MessageType type;
  final String? attachmentUrl;
  final bool isEdited;
  final bool isDeleted;
  final bool isRead;
  final DateTime createdAt;
  final DateTime? updatedAt;

  // Optional sender info (populated by Socket.IO)
  final MessageSender? sender;

  Message({
    required this.id,
    this.conversationId,
    required this.senderId,
    this.recipientId,
    this.adId,
    required this.content,
    this.type = MessageType.text,
    this.attachmentUrl,
    this.isEdited = false,
    this.isDeleted = false,
    this.isRead = false,
    required this.createdAt,
    this.updatedAt,
    this.sender,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    final senderObj = json['sender'] != null
        ? MessageSender.fromJson(json['sender'] as Map<String, dynamic>)
        : null;
        
    final sId = json['senderId'] as int? ?? json['sender_id'] as int? ?? 0;

    return Message(
      id: json['id'] as int,
      conversationId: json['conversationId'] as int? ?? json['conversation_id'] as int?,
      senderId: (sId == 0 && senderObj != null) ? senderObj.id : sId,
      recipientId: json['recipientId'] as int? ?? json['recipient_id'] as int?,
      adId: json['adId'] as int? ?? json['ad_id'] as int?,
      content: json['content'] as String? ?? json['message'] as String? ?? '',
      type: _parseMessageType(json['type']),
      attachmentUrl: json['attachmentUrl'] as String? ?? json['attachment_url'] as String?,
      isEdited: json['isEdited'] as bool? ?? json['is_edited'] as bool? ?? false,
      isDeleted: json['isDeleted'] as bool? ?? json['is_deleted'] as bool? ?? false,
      isRead: json['isRead'] as bool? ?? json['is_read'] as bool? ?? false,
      createdAt: _parseDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _parseDateTimeNullable(json['updatedAt'] ?? json['updated_at']),
      sender: senderObj,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'recipientId': recipientId,
      'adId': adId,
      'content': content,
      'type': type.name,
      'attachmentUrl': attachmentUrl,
      'isEdited': isEdited,
      'isDeleted': isDeleted,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  /// Backwards compatibility getter
  String get message => content;

  /// Check if this message was sent by the given user
  bool isSentBy(int userId) => senderId == userId;

  Message copyWith({
    int? id,
    int? conversationId,
    int? senderId,
    int? recipientId,
    int? adId,
    String? content,
    MessageType? type,
    String? attachmentUrl,
    bool? isEdited,
    bool? isDeleted,
    bool? isRead,
    DateTime? createdAt,
    DateTime? updatedAt,
    MessageSender? sender,
  }) {
    return Message(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      senderId: senderId ?? this.senderId,
      recipientId: recipientId ?? this.recipientId,
      adId: adId ?? this.adId,
      content: content ?? this.content,
      type: type ?? this.type,
      attachmentUrl: attachmentUrl ?? this.attachmentUrl,
      isEdited: isEdited ?? this.isEdited,
      isDeleted: isDeleted ?? this.isDeleted,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      sender: sender ?? this.sender,
    );
  }
}

/// Sender info embedded in Socket.IO messages
class MessageSender {
  final int id;
  final String name;
  final String? avatar;

  MessageSender({
    required this.id,
    required this.name,
    this.avatar,
  });

  factory MessageSender.fromJson(Map<String, dynamic> json) {
    return MessageSender(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? 'Unknown',
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
    };
  }
}

/// Typing indicator user
class TypingUser {
  final int id;
  final String name;
  final int conversationId;

  TypingUser({
    required this.id,
    required this.name,
    required this.conversationId,
  });

  factory TypingUser.fromJson(Map<String, dynamic> json) {
    return TypingUser(
      id: json['userId'] as int? ?? json['id'] as int? ?? 0,
      name: json['userName'] as String? ?? json['name'] as String? ?? 'Unknown',
      conversationId: json['conversationId'] as int? ?? json['conversation_id'] as int? ?? 0,
    );
  }
}

MessageType _parseMessageType(dynamic value) {
  if (value == null) return MessageType.text;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'image':
      return MessageType.image;
    case 'file':
      return MessageType.file;
    default:
      return MessageType.text;
  }
}

/// Conversation model (message thread summary)
class Conversation {
  final int id;
  final int otherUserId;
  final String otherUserName;
  final String? otherUserAvatar;
  final String lastMessage;
  final DateTime lastMessageAt;
  final int unreadCount;
  final String? adTitle;
  final int? adId;
  final String? adImage;

  Conversation({
    required this.id,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserAvatar,
    required this.lastMessage,
    required this.lastMessageAt,
    required this.unreadCount,
    this.adTitle,
    this.adId,
    this.adImage,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    // Extract other user from flat fields or participants array
    int otherUserId = json['otherUserId'] as int? ?? json['other_user_id'] as int? ?? 0;
    String otherUserName = json['otherUserName'] as String? ?? json['other_user_name'] as String? ?? 'Unknown';
    String? otherUserAvatar = json['otherUserAvatar'] as String? ?? json['other_user_avatar'] as String?;

    // Fallback: extract from participants array (Express format)
    if (otherUserId == 0 && json['participants'] is List) {
      final participants = json['participants'] as List;
      if (participants.isNotEmpty) {
        final other = participants[0] as Map<String, dynamic>;
        otherUserId = other['id'] as int? ?? 0;
        otherUserName = other['fullName'] as String? ?? other['full_name'] as String? ?? 'Unknown';
        otherUserAvatar = other['avatar'] as String?;
      }
    }

    // Extract last message from flat string or nested object
    String lastMessage = json['lastMessage'] as String? ?? '';
    if (lastMessage.isEmpty && json['last_message'] is Map) {
      lastMessage = (json['last_message'] as Map)['content'] as String? ?? '';
    } else if (lastMessage.isEmpty && json['last_message'] is String) {
      lastMessage = json['last_message'] as String;
    }

    return Conversation(
      id: json['id'] as int,
      otherUserId: otherUserId,
      otherUserName: otherUserName,
      otherUserAvatar: otherUserAvatar,
      lastMessage: lastMessage,
      lastMessageAt: _parseDateTime(json['lastMessageAt'] ?? json['last_message_at']),
      unreadCount: json['unreadCount'] as int? ?? json['unread_count'] as int? ?? 0,
      adTitle: json['adTitle'] as String? ?? json['ad_title'] as String?,
      adId: json['adId'] as int? ?? json['ad_id'] as int?,
      adImage: json['adImage'] as String? ?? json['ad_image'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'otherUserId': otherUserId,
      'otherUserName': otherUserName,
      'otherUserAvatar': otherUserAvatar,
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt.toIso8601String(),
      'unreadCount': unreadCount,
      'adTitle': adTitle,
      'adId': adId,
      'adImage': adImage,
    };
  }

  /// Check if this conversation has unread messages
  bool get hasUnread => unreadCount > 0;

  Conversation copyWith({
    int? id,
    int? otherUserId,
    String? otherUserName,
    String? otherUserAvatar,
    String? lastMessage,
    DateTime? lastMessageAt,
    int? unreadCount,
    String? adTitle,
    int? adId,
    String? adImage,
  }) {
    return Conversation(
      id: id ?? this.id,
      otherUserId: otherUserId ?? this.otherUserId,
      otherUserName: otherUserName ?? this.otherUserName,
      otherUserAvatar: otherUserAvatar ?? this.otherUserAvatar,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      unreadCount: unreadCount ?? this.unreadCount,
      adTitle: adTitle ?? this.adTitle,
      adId: adId ?? this.adId,
      adImage: adImage ?? this.adImage,
    );
  }
}

/// Announcement model
class Announcement {
  final int id;
  final String title;
  final String content;
  final String targetAudience;
  final DateTime createdAt;
  final DateTime? expiresAt;
  final bool isRead;
  final DateTime? readAt;

  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.targetAudience,
    required this.createdAt,
    this.expiresAt,
    this.isRead = false,
    this.readAt,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      targetAudience: json['targetAudience'] as String? ?? json['target_audience'] as String? ?? 'all_users',
      createdAt: _parseDateTime(json['createdAt'] ?? json['created_at']),
      expiresAt: _parseDateTimeNullable(json['expiresAt'] ?? json['expires_at']),
      isRead: json['isRead'] as bool? ?? json['is_read'] as bool? ?? false,
      readAt: _parseDateTimeNullable(json['readAt'] ?? json['read_at']),
    );
  }

  Announcement copyWith({bool? isRead, DateTime? readAt}) {
    return Announcement(
      id: id,
      title: title,
      content: content,
      targetAudience: targetAudience,
      createdAt: createdAt,
      expiresAt: expiresAt,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
    );
  }
}

/// Search result user
class SearchUser {
  final int id;
  final String fullName;
  final String? avatar;

  SearchUser({required this.id, required this.fullName, this.avatar});

  factory SearchUser.fromJson(Map<String, dynamic> json) {
    return SearchUser(
      id: json['id'] as int,
      fullName: json['fullName'] as String? ?? json['full_name'] as String? ?? 'Unknown',
      avatar: json['avatar'] as String?,
    );
  }
}

// Helper functions
DateTime _parseDateTime(dynamic value) {
  if (value == null) return DateTime.now();
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString()) ?? DateTime.now();
}

DateTime? _parseDateTimeNullable(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}
