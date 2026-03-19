/// Notification model - mirrors AppNotification from @thulobazaar/types

class NotificationItem {
  final int id;
  final int userId;
  final String type;
  final String title;
  final String body;
  final Map<String, dynamic>? data;
  final String? imageUrl;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.userId,
    required this.type,
    required this.title,
    required this.body,
    this.data,
    this.imageUrl,
    this.isRead = false,
    this.readAt,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as int,
      userId: json['userId'] as int? ?? json['user_id'] as int? ?? 0,
      type: json['type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      data: json['data'] as Map<String, dynamic>?,
      imageUrl: json['imageUrl'] as String? ?? json['image_url'] as String?,
      isRead: json['isRead'] as bool? ?? json['is_read'] as bool? ?? false,
      readAt: json['readAt'] != null
          ? DateTime.tryParse(json['readAt'] as String)
          : json['read_at'] != null
              ? DateTime.tryParse(json['read_at'] as String)
              : null,
      createdAt: DateTime.tryParse(
              json['createdAt'] as String? ?? json['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  NotificationItem copyWith({bool? isRead, DateTime? readAt}) {
    return NotificationItem(
      id: id,
      userId: userId,
      type: type,
      title: title,
      body: body,
      data: data,
      imageUrl: imageUrl,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt,
    );
  }

  /// Route to navigate to when tapped
  String? get route => data?['route'] as String?;

  /// Ad ID if notification is about an ad
  String? get adId => data?['adId'] as String?;
}
