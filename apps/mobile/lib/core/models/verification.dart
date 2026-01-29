/// Verification models - mirrors TypeScript verification types

// ==========================================
// VERIFICATION STATUS
// ==========================================

enum VerificationStatusType { unverified, pending, verified, rejected }

/// Individual verification request details
class VerificationRequest {
  final int id;
  final String status;
  final String? rejectionReason;
  final String? paymentStatus;
  final double? paymentAmount;
  final int? durationDays;
  final bool canResubmitFree;
  final DateTime? createdAt;

  VerificationRequest({
    required this.id,
    required this.status,
    this.rejectionReason,
    this.paymentStatus,
    this.paymentAmount,
    this.durationDays,
    this.canResubmitFree = false,
    this.createdAt,
  });

  factory VerificationRequest.fromJson(Map<String, dynamic> json) {
    return VerificationRequest(
      id: json['id'] as int,
      status: json['status'] as String? ?? 'pending',
      rejectionReason: json['rejectionReason'] as String? ?? json['rejection_reason'] as String?,
      paymentStatus: json['paymentStatus'] as String? ?? json['payment_status'] as String?,
      paymentAmount: _parseDoubleNullable(json['paymentAmount'] ?? json['payment_amount']),
      durationDays: json['durationDays'] as int? ?? json['duration_days'] as int?,
      canResubmitFree: json['canResubmitFree'] as bool? ?? json['can_resubmit_free'] as bool? ?? false,
      createdAt: _parseDateTimeNullable(json['createdAt'] ?? json['created_at']),
    );
  }
}

/// Status data for a single verification type (business or individual)
class VerificationStatusData {
  final String status; // unverified, pending, verified, rejected
  final bool verified;
  final bool isActive;
  final String? rejectionReason;
  final DateTime? expiresAt;
  final int? daysRemaining;
  final bool isExpiringSoon;
  final bool hasRequest;
  final VerificationRequest? request;
  // Additional fields
  final String? fullName;
  final String? businessName;

  VerificationStatusData({
    required this.status,
    required this.verified,
    this.isActive = false,
    this.rejectionReason,
    this.expiresAt,
    this.daysRemaining,
    this.isExpiringSoon = false,
    this.hasRequest = false,
    this.request,
    this.fullName,
    this.businessName,
  });

  factory VerificationStatusData.fromJson(Map<String, dynamic> json) {
    return VerificationStatusData(
      status: json['status'] as String? ?? 'unverified',
      verified: json['verified'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? false,
      rejectionReason: json['rejectionReason'] as String? ?? json['rejection_reason'] as String?,
      expiresAt: _parseDateTimeNullable(json['expiresAt'] ?? json['expires_at']),
      daysRemaining: json['daysRemaining'] as int? ?? json['days_remaining'] as int?,
      isExpiringSoon: json['isExpiringSoon'] as bool? ?? json['is_expiring_soon'] as bool? ?? false,
      hasRequest: json['hasRequest'] as bool? ?? json['has_request'] as bool? ?? false,
      request: json['request'] != null
          ? VerificationRequest.fromJson(json['request'] as Map<String, dynamic>)
          : null,
      fullName: json['fullName'] as String? ?? json['full_name'] as String?,
      businessName: json['businessName'] as String? ?? json['business_name'] as String?,
    );
  }

  VerificationStatusType get statusType {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'approved':
        return VerificationStatusType.verified;
      case 'pending':
      case 'pending_payment':
        return VerificationStatusType.pending;
      case 'rejected':
        return VerificationStatusType.rejected;
      default:
        return VerificationStatusType.unverified;
    }
  }
}

/// Combined verification status response (both business and individual)
/// Named differently to avoid collision with VerificationStatus enum in user.dart
class VerificationStatusResponse {
  final String accountType;
  final VerificationStatusData business;
  final VerificationStatusData individual;

  VerificationStatusResponse({
    required this.accountType,
    required this.business,
    required this.individual,
  });

  factory VerificationStatusResponse.fromJson(Map<String, dynamic> json) {
    return VerificationStatusResponse(
      accountType: json['accountType'] as String? ?? json['account_type'] as String? ?? 'individual',
      business: VerificationStatusData.fromJson(
        (json['businessVerification'] ?? json['business_verification'] ?? {}) as Map<String, dynamic>,
      ),
      individual: VerificationStatusData.fromJson(
        (json['individualVerification'] ?? json['individual_verification'] ?? {}) as Map<String, dynamic>,
      ),
    );
  }

  /// Check if user has any active verification
  bool get hasAnyVerification => business.verified || individual.verified;
}

// ==========================================
// VERIFICATION PRICING
// ==========================================

/// A single pricing option
class PricingOption {
  final int id;
  final int durationDays;
  final String durationLabel;
  final double price;
  final int discountPercentage;
  final double finalPrice;
  final bool hasCampaignDiscount;

  PricingOption({
    required this.id,
    required this.durationDays,
    required this.durationLabel,
    required this.price,
    required this.discountPercentage,
    required this.finalPrice,
    this.hasCampaignDiscount = false,
  });

  factory PricingOption.fromJson(Map<String, dynamic> json) {
    return PricingOption(
      id: json['id'] as int,
      durationDays: json['durationDays'] as int? ?? json['duration_days'] as int? ?? 365,
      durationLabel: json['durationLabel'] as String? ?? json['duration_label'] as String? ?? '1 Year',
      price: _parseDouble(json['price']),
      discountPercentage: json['discountPercentage'] as int? ?? json['discount_percentage'] as int? ?? 0,
      finalPrice: _parseDouble(json['finalPrice'] ?? json['final_price']),
      hasCampaignDiscount: json['hasCampaignDiscount'] as bool? ?? json['has_campaign_discount'] as bool? ?? false,
    );
  }

  /// Savings amount if there's a discount
  double get savings => price - finalPrice;

  /// Human-readable savings text
  String get savingsText => savings > 0 ? 'Save Rs. ${savings.toStringAsFixed(0)}' : '';
}

/// Active campaign details
class VerificationCampaign {
  final int id;
  final String name;
  final String? description;
  final int discountPercentage;
  final String bannerText;
  final String? bannerEmoji;
  final DateTime startDate;
  final DateTime endDate;
  final int daysRemaining;
  final List<String> appliesToTypes;
  final int? minDurationDays;

  VerificationCampaign({
    required this.id,
    required this.name,
    this.description,
    required this.discountPercentage,
    required this.bannerText,
    this.bannerEmoji,
    required this.startDate,
    required this.endDate,
    required this.daysRemaining,
    required this.appliesToTypes,
    this.minDurationDays,
  });

  factory VerificationCampaign.fromJson(Map<String, dynamic> json) {
    return VerificationCampaign(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      discountPercentage: json['discountPercentage'] as int? ?? json['discount_percentage'] as int? ?? 0,
      bannerText: json['bannerText'] as String? ?? json['banner_text'] as String? ?? '',
      bannerEmoji: json['bannerEmoji'] as String? ?? json['banner_emoji'] as String?,
      startDate: _parseDateTime(json['startDate'] ?? json['start_date']),
      endDate: _parseDateTime(json['endDate'] ?? json['end_date']),
      daysRemaining: json['daysRemaining'] as int? ?? json['days_remaining'] as int? ?? 0,
      appliesToTypes: (json['appliesToTypes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      minDurationDays: json['minDurationDays'] as int? ?? json['min_duration_days'] as int?,
    );
  }
}

/// Free verification settings
class FreeVerificationSettings {
  final bool enabled;
  final int durationDays;
  final List<String> types;
  final bool isEligible;

  FreeVerificationSettings({
    required this.enabled,
    required this.durationDays,
    required this.types,
    required this.isEligible,
  });

  factory FreeVerificationSettings.fromJson(Map<String, dynamic> json) {
    return FreeVerificationSettings(
      enabled: json['enabled'] as bool? ?? false,
      durationDays: json['durationDays'] as int? ?? json['duration_days'] as int? ?? 180,
      types: (json['types'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['individual', 'business'],
      isEligible: json['isEligible'] as bool? ?? json['is_eligible'] as bool? ?? false,
    );
  }

  bool appliesToType(String type) => types.contains(type);
}

/// Complete pricing response
class VerificationPricing {
  final List<PricingOption> individual;
  final List<PricingOption> business;
  final FreeVerificationSettings freeVerification;
  final VerificationCampaign? campaign;

  VerificationPricing({
    required this.individual,
    required this.business,
    required this.freeVerification,
    this.campaign,
  });

  factory VerificationPricing.fromJson(Map<String, dynamic> json) {
    return VerificationPricing(
      individual: (json['individual'] as List<dynamic>?)
          ?.map((e) => PricingOption.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      business: (json['business'] as List<dynamic>?)
          ?.map((e) => PricingOption.fromJson(e as Map<String, dynamic>))
          .toList() ?? [],
      freeVerification: FreeVerificationSettings.fromJson(
        (json['freeVerification'] ?? json['free_verification'] ?? {}) as Map<String, dynamic>,
      ),
      campaign: json['campaign'] != null
          ? VerificationCampaign.fromJson(json['campaign'] as Map<String, dynamic>)
          : null,
    );
  }

  /// Check if there's an active campaign
  bool get hasCampaign => campaign != null;

  /// Get pricing for a specific type
  List<PricingOption> getPricingForType(String type) {
    return type == 'business' ? business : individual;
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0.0;
}

double? _parseDoubleNullable(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value.toString());
}

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
