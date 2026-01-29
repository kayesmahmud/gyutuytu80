/// Promotion models - mirrors TypeScript promotion types

// ==========================================
// PROMOTION TYPES
// ==========================================

enum PromotionTypeEnum { featured, urgent, sticky }

extension PromotionTypeEnumExt on PromotionTypeEnum {
  String get apiValue {
    switch (this) {
      case PromotionTypeEnum.featured:
        return 'featured';
      case PromotionTypeEnum.urgent:
        return 'urgent';
      case PromotionTypeEnum.sticky:
        return 'sticky';
    }
  }

  String get displayName {
    switch (this) {
      case PromotionTypeEnum.featured:
        return 'Featured';
      case PromotionTypeEnum.urgent:
        return 'Urgent';
      case PromotionTypeEnum.sticky:
        return 'Sticky';
    }
  }

  String get emoji {
    switch (this) {
      case PromotionTypeEnum.featured:
        return '⭐';
      case PromotionTypeEnum.urgent:
        return '🔥';
      case PromotionTypeEnum.sticky:
        return '📌';
    }
  }

  String get description {
    switch (this) {
      case PromotionTypeEnum.featured:
        return 'Maximum visibility across entire platform';
      case PromotionTypeEnum.urgent:
        return 'Priority placement for quick sales';
      case PromotionTypeEnum.sticky:
        return 'Stay at top of category listings';
    }
  }

  List<String> get benefits {
    switch (this) {
      case PromotionTypeEnum.featured:
        return ['Homepage carousel', 'Top of search results', 'Category highlights'];
      case PromotionTypeEnum.urgent:
        return ['Top of category', 'Above sticky ads', 'Urgent badge with animation'];
      case PromotionTypeEnum.sticky:
        return ['Category visibility', 'Cost-effective', 'Consistent placement'];
    }
  }
}

// ==========================================
// PROMOTION PRICING
// ==========================================

class PromotionPricing {
  final int id;
  final PromotionTypeEnum promotionType;
  final int durationDays;
  final String accountType;
  final String pricingTier;
  final double price;
  final int discountPercentage;
  final bool isActive;

  PromotionPricing({
    required this.id,
    required this.promotionType,
    required this.durationDays,
    required this.accountType,
    required this.pricingTier,
    required this.price,
    required this.discountPercentage,
    required this.isActive,
  });

  factory PromotionPricing.fromJson(Map<String, dynamic> json) {
    return PromotionPricing(
      id: json['id'] as int? ?? 0,
      promotionType: _parsePromotionType(json['promotionType'] ?? json['promotion_type']),
      durationDays: json['durationDays'] as int? ?? json['duration_days'] as int? ?? 0,
      accountType: json['accountType'] as String? ?? json['account_type'] as String? ?? 'individual',
      pricingTier: json['pricingTier'] as String? ?? json['pricing_tier'] as String? ?? 'default',
      price: _parseDouble(json['price']),
      discountPercentage: json['discountPercentage'] as int? ?? json['discount_percentage'] as int? ?? 0,
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
    );
  }

  double get finalPrice => price * (1 - discountPercentage / 100);
}

// ==========================================
// CALCULATED PRICE
// ==========================================

class CalculatedPrice {
  final double originalPrice;
  final double finalPrice;
  final int totalDiscount;
  final int accountDiscount;
  final int campaignDiscount;
  final String accountType;
  final String? campaignName;

  CalculatedPrice({
    required this.originalPrice,
    required this.finalPrice,
    required this.totalDiscount,
    required this.accountDiscount,
    required this.campaignDiscount,
    required this.accountType,
    this.campaignName,
  });

  factory CalculatedPrice.fromJson(Map<String, dynamic> json) {
    return CalculatedPrice(
      originalPrice: _parseDouble(json['originalPrice'] ?? json['original_price']),
      finalPrice: _parseDouble(json['finalPrice'] ?? json['final_price']),
      totalDiscount: json['totalDiscount'] as int? ?? json['total_discount'] as int? ?? 0,
      accountDiscount: json['accountDiscount'] as int? ?? json['account_discount'] as int? ?? 0,
      campaignDiscount: json['campaignDiscount'] as int? ?? json['campaign_discount'] as int? ?? 0,
      accountType: json['accountType'] as String? ?? json['account_type'] as String? ?? 'individual',
      campaignName: json['campaignName'] as String? ?? json['campaign_name'] as String?,
    );
  }

  double get savings => originalPrice - finalPrice;
}

// ==========================================
// PROMOTION CAMPAIGN
// ==========================================

class PromotionCampaign {
  final int id;
  final String name;
  final String? description;
  final int discountPercentage;
  final DateTime startsAt;
  final DateTime endsAt;
  final bool isActive;
  final List<String>? applicableTypes;

  PromotionCampaign({
    required this.id,
    required this.name,
    this.description,
    required this.discountPercentage,
    required this.startsAt,
    required this.endsAt,
    required this.isActive,
    this.applicableTypes,
  });

  factory PromotionCampaign.fromJson(Map<String, dynamic> json) {
    return PromotionCampaign(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      discountPercentage: json['discountPercentage'] as int? ?? json['discount_percentage'] as int? ?? 0,
      startsAt: _parseDateTime(json['startsAt'] ?? json['starts_at']),
      endsAt: _parseDateTime(json['endsAt'] ?? json['ends_at']),
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? false,
      applicableTypes: (json['applicableTypes'] as List<dynamic>?)?.map((e) => e.toString()).toList(),
    );
  }

  bool get isCurrentlyActive {
    final now = DateTime.now();
    return isActive && now.isAfter(startsAt) && now.isBefore(endsAt);
  }
}

// ==========================================
// AD PROMOTION RECORD
// ==========================================

class AdPromotion {
  final int id;
  final int adId;
  final int userId;
  final PromotionTypeEnum promotionType;
  final int durationDays;
  final double pricePaid;
  final String accountType;
  final String? paymentReference;
  final String? paymentMethod;
  final DateTime startsAt;
  final DateTime expiresAt;
  final bool isActive;
  final DateTime createdAt;

  AdPromotion({
    required this.id,
    required this.adId,
    required this.userId,
    required this.promotionType,
    required this.durationDays,
    required this.pricePaid,
    required this.accountType,
    this.paymentReference,
    this.paymentMethod,
    required this.startsAt,
    required this.expiresAt,
    required this.isActive,
    required this.createdAt,
  });

  factory AdPromotion.fromJson(Map<String, dynamic> json) {
    return AdPromotion(
      id: json['id'] as int? ?? 0,
      adId: json['adId'] as int? ?? json['ad_id'] as int? ?? 0,
      userId: json['userId'] as int? ?? json['user_id'] as int? ?? 0,
      promotionType: _parsePromotionType(json['promotionType'] ?? json['promotion_type']),
      durationDays: json['durationDays'] as int? ?? json['duration_days'] as int? ?? 0,
      pricePaid: _parseDouble(json['pricePaid'] ?? json['price_paid']),
      accountType: json['accountType'] as String? ?? json['account_type'] as String? ?? 'individual',
      paymentReference: json['paymentReference'] as String? ?? json['payment_reference'] as String?,
      paymentMethod: json['paymentMethod'] as String? ?? json['payment_method'] as String?,
      startsAt: _parseDateTime(json['startsAt'] ?? json['starts_at']),
      expiresAt: _parseDateTime(json['expiresAt'] ?? json['expires_at']),
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? false,
      createdAt: _parseDateTime(json['createdAt'] ?? json['created_at']),
    );
  }

  bool get isCurrentlyActive {
    return isActive && DateTime.now().isBefore(expiresAt);
  }

  Duration get timeRemaining {
    final remaining = expiresAt.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }
}

// ==========================================
// PRICING RESPONSE
// ==========================================

class PricingResponse {
  final List<PromotionPricing> pricing;
  final PromotionCampaign? activeCampaign;
  final String userAccountType;

  PricingResponse({
    required this.pricing,
    this.activeCampaign,
    required this.userAccountType,
  });

  factory PricingResponse.fromJson(Map<String, dynamic> json) {
    return PricingResponse(
      pricing: (json['pricing'] as List<dynamic>?)
              ?.map((e) => PromotionPricing.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      activeCampaign: json['activeCampaign'] != null || json['active_campaign'] != null
          ? PromotionCampaign.fromJson(
              (json['activeCampaign'] ?? json['active_campaign']) as Map<String, dynamic>)
          : null,
      userAccountType:
          json['userAccountType'] as String? ?? json['user_account_type'] as String? ?? 'individual',
    );
  }

  /// Get price for specific type and duration
  PromotionPricing? getPricing(PromotionTypeEnum type, int durationDays) {
    return pricing.firstWhere(
      (p) => p.promotionType == type && p.durationDays == durationDays && p.isActive,
      orElse: () => pricing.first,
    );
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

PromotionTypeEnum _parsePromotionType(dynamic value) {
  if (value == null) return PromotionTypeEnum.featured;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'urgent':
      return PromotionTypeEnum.urgent;
    case 'sticky':
      return PromotionTypeEnum.sticky;
    case 'featured':
    default:
      return PromotionTypeEnum.featured;
  }
}

double _parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0.0;
}

DateTime _parseDateTime(dynamic value) {
  if (value == null) return DateTime.now();
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString()) ?? DateTime.now();
}
