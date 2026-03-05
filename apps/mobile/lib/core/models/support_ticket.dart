enum SupportTicketStatus {
  open,
  inProgress,
  waitingOnUser,
  resolved,
  closed;

  static SupportTicketStatus fromString(String? value) {
    switch (value) {
      case 'in_progress':
        return inProgress;
      case 'waiting_on_user':
        return waitingOnUser;
      default:
        return SupportTicketStatus.values.firstWhere(
          (e) => e.name == value,
          orElse: () => open,
        );
    }
  }

  String get label {
    switch (this) {
      case open:
        return 'Open';
      case inProgress:
        return 'In Progress';
      case waitingOnUser:
        return 'Waiting on You';
      case resolved:
        return 'Resolved';
      case closed:
        return 'Closed';
    }
  }

  String get apiValue {
    switch (this) {
      case inProgress:
        return 'in_progress';
      case waitingOnUser:
        return 'waiting_on_user';
      default:
        return name;
    }
  }
}

enum SupportTicketCategory {
  general,
  account,
  payment,
  ads,
  verification,
  technical,
  report,
  other;

  String get label {
    switch (this) {
      case general:
        return 'General';
      case account:
        return 'Account';
      case payment:
        return 'Payment';
      case ads:
        return 'Ads';
      case verification:
        return 'Verification';
      case technical:
        return 'Technical';
      case report:
        return 'Report';
      case other:
        return 'Other';
    }
  }
}

enum SupportTicketPriority {
  low,
  normal,
  high,
  urgent;

  String get label {
    switch (this) {
      case low:
        return 'Low';
      case normal:
        return 'Normal';
      case high:
        return 'High';
      case urgent:
        return 'Urgent';
    }
  }
}

class SupportTicket {
  final int id;
  final String ticketNumber;
  final String subject;
  final SupportTicketCategory category;
  final SupportTicketPriority priority;
  final SupportTicketStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? lastMessageContent;
  final DateTime? lastMessageAt;

  SupportTicket({
    required this.id,
    required this.ticketNumber,
    required this.subject,
    required this.category,
    required this.priority,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.lastMessageContent,
    this.lastMessageAt,
  });

  factory SupportTicket.fromMap(Map<String, dynamic> json) {
    final lastMsg = json['lastMessage'] as Map<String, dynamic>?;
    return SupportTicket(
      id: json['id'] as int,
      ticketNumber: json['ticketNumber'] as String? ?? json['ticket_number'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      category: SupportTicketCategory.values.firstWhere(
        (e) => e.name == (json['category'] as String?),
        orElse: () => SupportTicketCategory.general,
      ),
      priority: SupportTicketPriority.values.firstWhere(
        (e) => e.name == (json['priority'] as String?),
        orElse: () => SupportTicketPriority.normal,
      ),
      status: SupportTicketStatus.fromString(json['status'] as String?),
      createdAt: DateTime.parse(json['createdAt'] as String? ?? json['created_at'] as String? ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] as String? ?? json['updated_at'] as String? ?? DateTime.now().toIso8601String()),
      lastMessageContent: lastMsg?['content'] as String?,
      lastMessageAt: lastMsg?['createdAt'] != null
          ? DateTime.parse(lastMsg!['createdAt'] as String)
          : null,
    );
  }
}

class SupportMessage {
  final int id;
  final int senderId;
  final String content;
  final String type;
  final String? attachmentUrl;
  final DateTime createdAt;
  final SupportMessageSender sender;
  final bool isOwnMessage;

  SupportMessage({
    required this.id,
    required this.senderId,
    required this.content,
    required this.type,
    this.attachmentUrl,
    required this.createdAt,
    required this.sender,
    required this.isOwnMessage,
  });

  factory SupportMessage.fromMap(Map<String, dynamic> json) {
    return SupportMessage(
      id: json['id'] as int,
      senderId: json['senderId'] as int? ?? json['sender_id'] as int? ?? 0,
      content: json['content'] as String? ?? '',
      type: json['type'] as String? ?? 'text',
      attachmentUrl: json['attachmentUrl'] as String? ?? json['attachment_url'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String? ?? json['created_at'] as String? ?? DateTime.now().toIso8601String()),
      sender: SupportMessageSender.fromMap(json['sender'] as Map<String, dynamic>? ?? {}),
      isOwnMessage: json['isOwnMessage'] as bool? ?? false,
    );
  }
}

class SupportMessageSender {
  final int id;
  final String fullName;
  final String? avatar;
  final bool isStaff;

  SupportMessageSender({
    required this.id,
    required this.fullName,
    this.avatar,
    required this.isStaff,
  });

  factory SupportMessageSender.fromMap(Map<String, dynamic> json) {
    return SupportMessageSender(
      id: json['id'] as int? ?? 0,
      fullName: json['fullName'] as String? ?? json['full_name'] as String? ?? 'Unknown',
      avatar: json['avatar'] as String?,
      isStaff: json['isStaff'] as bool? ?? false,
    );
  }
}

class SupportTicketDetail {
  final int id;
  final String ticketNumber;
  final String subject;
  final SupportTicketCategory category;
  final SupportTicketPriority priority;
  final SupportTicketStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? resolvedAt;
  final DateTime? closedAt;
  final List<SupportMessage> messages;

  SupportTicketDetail({
    required this.id,
    required this.ticketNumber,
    required this.subject,
    required this.category,
    required this.priority,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.resolvedAt,
    this.closedAt,
    required this.messages,
  });

  factory SupportTicketDetail.fromMap(Map<String, dynamic> json) {
    final msgList = json['messages'] as List<dynamic>? ?? [];
    return SupportTicketDetail(
      id: json['id'] as int,
      ticketNumber: json['ticketNumber'] as String? ?? json['ticket_number'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      category: SupportTicketCategory.values.firstWhere(
        (e) => e.name == (json['category'] as String?),
        orElse: () => SupportTicketCategory.general,
      ),
      priority: SupportTicketPriority.values.firstWhere(
        (e) => e.name == (json['priority'] as String?),
        orElse: () => SupportTicketPriority.normal,
      ),
      status: SupportTicketStatus.fromString(json['status'] as String?),
      createdAt: DateTime.parse(json['createdAt'] as String? ?? json['created_at'] as String? ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] as String? ?? json['updated_at'] as String? ?? DateTime.now().toIso8601String()),
      resolvedAt: json['resolvedAt'] != null ? DateTime.parse(json['resolvedAt'] as String) : null,
      closedAt: json['closedAt'] != null ? DateTime.parse(json['closedAt'] as String) : null,
      messages: msgList.map((e) => SupportMessage.fromMap(e as Map<String, dynamic>)).toList(),
    );
  }
}
