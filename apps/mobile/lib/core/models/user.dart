/// User models - mirrors @thulobazaar/types User interfaces

// Enums matching TypeScript types
enum UserRole { user, editor, superAdmin }

enum AccountType { individual, business }

enum VerificationStatus { unverified, pending, verified, rejected }

/// Main User model
class User {
  final int id;
  final String? email;
  final String fullName;
  final String? phone;
  final String? avatar;
  final UserRole role;
  final AccountType accountType;
  final VerificationStatus? businessVerificationStatus;
  final bool individualVerified;
  final String? shopSlug;
  final bool isActive;
  final int? locationId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool? hasPassword;
  final String? oauthProvider;

  User({
    required this.id,
    this.email,
    required this.fullName,
    this.phone,
    this.avatar,
    required this.role,
    required this.accountType,
    this.businessVerificationStatus,
    required this.individualVerified,
    this.shopSlug,
    required this.isActive,
    this.locationId,
    required this.createdAt,
    required this.updatedAt,
    this.hasPassword,
    this.oauthProvider,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String?,
      fullName: json['fullName'] as String? ?? json['full_name'] as String? ?? '',
      phone: json['phone'] as String?,
      avatar: json['avatar'] as String?,
      role: _parseUserRole(json['role']),
      accountType: _parseAccountType(json['accountType'] ?? json['account_type']),
      businessVerificationStatus: _parseVerificationStatus(
        json['businessVerificationStatus'] ?? json['business_verification_status'],
      ),
      individualVerified: json['individualVerified'] as bool? ??
          json['individual_verified'] as bool? ??
          false,
      shopSlug: json['shopSlug'] as String? ?? json['shop_slug'] as String?,
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
      locationId: json['locationId'] as int? ?? json['location_id'] as int?,
      createdAt: _parseDateTime(json['createdAt'] ?? json['created_at']),
      updatedAt: _parseDateTime(json['updatedAt'] ?? json['updated_at']),
      hasPassword: json['hasPassword'] as bool? ?? json['has_password'] as bool?,
      oauthProvider: json['oauthProvider'] as String? ?? json['oauth_provider'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'fullName': fullName,
      'phone': phone,
      'avatar': avatar,
      'role': role.name,
      'accountType': accountType.name,
      'businessVerificationStatus': businessVerificationStatus?.name,
      'individualVerified': individualVerified,
      'shopSlug': shopSlug,
      'isActive': isActive,
      'locationId': locationId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'hasPassword': hasPassword,
      'oauthProvider': oauthProvider,
    };
  }

  /// Check if user is verified (either business or individual)
  bool get isVerified {
    if (accountType == AccountType.business) {
      return businessVerificationStatus == VerificationStatus.verified;
    }
    return individualVerified;
  }

  User copyWith({
    int? id,
    String? email,
    String? fullName,
    String? phone,
    String? avatar,
    UserRole? role,
    AccountType? accountType,
    VerificationStatus? businessVerificationStatus,
    bool? individualVerified,
    String? shopSlug,
    bool? isActive,
    int? locationId,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? hasPassword,
    String? oauthProvider,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      avatar: avatar ?? this.avatar,
      role: role ?? this.role,
      accountType: accountType ?? this.accountType,
      businessVerificationStatus: businessVerificationStatus ?? this.businessVerificationStatus,
      individualVerified: individualVerified ?? this.individualVerified,
      shopSlug: shopSlug ?? this.shopSlug,
      isActive: isActive ?? this.isActive,
      locationId: locationId ?? this.locationId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      hasPassword: hasPassword ?? this.hasPassword,
      oauthProvider: oauthProvider ?? this.oauthProvider,
    );
  }
}

/// Extended User with profile fields
class UserProfile extends User {
  final String? bio;
  final String? coverPhoto;
  final int? totalAds;
  final int? activeAds;

  UserProfile({
    required super.id,
    super.email,
    required super.fullName,
    super.phone,
    super.avatar,
    required super.role,
    required super.accountType,
    super.businessVerificationStatus,
    required super.individualVerified,
    super.shopSlug,
    required super.isActive,
    super.locationId,
    required super.createdAt,
    required super.updatedAt,
    super.hasPassword,
    super.oauthProvider,
    this.bio,
    this.coverPhoto,
    this.totalAds,
    this.activeAds,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final user = User.fromJson(json);
    return UserProfile(
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      accountType: user.accountType,
      businessVerificationStatus: user.businessVerificationStatus,
      individualVerified: user.individualVerified,
      shopSlug: user.shopSlug,
      isActive: user.isActive,
      locationId: user.locationId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasPassword: user.hasPassword,
      oauthProvider: user.oauthProvider,
      bio: json['bio'] as String?,
      coverPhoto: json['coverPhoto'] as String? ?? json['cover_photo'] as String?,
      totalAds: json['totalAds'] as int? ?? json['total_ads'] as int?,
      activeAds: json['activeAds'] as int? ?? json['active_ads'] as int?,
    );
  }
}

// Helper functions for parsing
UserRole _parseUserRole(dynamic value) {
  if (value == null) return UserRole.user;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'editor':
      return UserRole.editor;
    case 'super_admin':
    case 'superadmin':
      return UserRole.superAdmin;
    default:
      return UserRole.user;
  }
}

AccountType _parseAccountType(dynamic value) {
  if (value == null) return AccountType.individual;
  final str = value.toString().toLowerCase();
  return str == 'business' ? AccountType.business : AccountType.individual;
}

VerificationStatus? _parseVerificationStatus(dynamic value) {
  if (value == null) return null;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'pending':
      return VerificationStatus.pending;
    case 'verified':
    case 'approved':
      return VerificationStatus.verified;
    case 'rejected':
      return VerificationStatus.rejected;
    default:
      return VerificationStatus.unverified;
  }
}

DateTime _parseDateTime(dynamic value) {
  if (value == null) return DateTime.now();
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString()) ?? DateTime.now();
}
