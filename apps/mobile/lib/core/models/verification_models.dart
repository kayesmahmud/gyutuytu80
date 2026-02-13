
class VerificationStatusResponse {
  final bool success;
  final String? error;
  final String? accountType;
  final BusinessVerificationStatus? businessVerification;
  final IndividualVerificationStatus? individualVerification;

  VerificationStatusResponse({
    required this.success,
    this.error,
    this.accountType,
    this.businessVerification,
    this.individualVerification,
  });

  factory VerificationStatusResponse.fromJson(Map<String, dynamic> json) {
    // If wrapping in {success: true, data: {...}}
    final data = json['data'] ?? json;
    
    return VerificationStatusResponse(
      success: json['success'] == true,
      error: json['message'], // sometimes error comes as message in 200 OK w/ success: false
      accountType: data['accountType'],
      businessVerification: data['businessVerification'] != null
          ? BusinessVerificationStatus.fromJson(data['businessVerification'])
          : null,
      individualVerification: data['individualVerification'] != null
          ? IndividualVerificationStatus.fromJson(data['individualVerification'])
          : null,
    );
  }
}


class BusinessVerificationStatus {
  final String status; // 'verified', 'pending', 'rejected', 'unverified'
  final bool verified;
  final String? businessName;
  final String? expiresAt;
  final int? daysRemaining;
  final bool isExpiringSoon;
  final bool hasRequest;
  final VerificationRequestDetails? request;

  BusinessVerificationStatus({
    required this.status,
    required this.verified,
    this.businessName,
    this.expiresAt,
    this.daysRemaining,
    this.isExpiringSoon = false,
    this.hasRequest = false,
    this.request,
  });

  factory BusinessVerificationStatus.fromJson(Map<String, dynamic> json) {
    return BusinessVerificationStatus(
      status: json['status'] ?? 'unverified',
      verified: json['verified'] == true,
      businessName: json['businessName'],
      expiresAt: json['expiresAt'],
      daysRemaining: json['daysRemaining'],
      isExpiringSoon: json['isExpiringSoon'] == true,
      hasRequest: json['hasRequest'] == true,
      request: json['request'] != null
          ? VerificationRequestDetails.fromJson(json['request'])
          : null,
    );
  }
}

class IndividualVerificationStatus {
  final String status;
  final bool verified;
  final String? fullName;
  final String? expiresAt;
  final int? daysRemaining;
  final bool isExpiringSoon;
  final bool hasRequest;
  final VerificationRequestDetails? request;

  IndividualVerificationStatus({
    required this.status,
    required this.verified,
    this.fullName,
    this.expiresAt,
    this.daysRemaining,
    this.isExpiringSoon = false,
    this.hasRequest = false,
    this.request,
  });

  factory IndividualVerificationStatus.fromJson(Map<String, dynamic> json) {
    return IndividualVerificationStatus(
      status: json['status'] ?? 'unverified',
      verified: json['verified'] == true,
      fullName: json['fullName'],
      expiresAt: json['expiresAt'],
      daysRemaining: json['daysRemaining'],
      isExpiringSoon: json['isExpiringSoon'] == true,
      hasRequest: json['hasRequest'] == true,
      request: json['request'] != null
          ? VerificationRequestDetails.fromJson(json['request'])
          : null,
    );
  }
}

class VerificationRequestDetails {
  final int id;
  final String status;
  final String? businessName;
  final String? fullName;
  final String? rejectionReason;
  final int? durationDays;
  final String? createdAt;
  final String? paymentStatus;
  final double? paymentAmount;
  final bool canResubmitFree;

  VerificationRequestDetails({
    required this.id,
    required this.status,
    this.businessName,
    this.fullName,
    this.rejectionReason,
    this.durationDays,
    this.createdAt,
    this.paymentStatus,
    this.paymentAmount,
    this.canResubmitFree = false,
  });

  factory VerificationRequestDetails.fromJson(Map<String, dynamic> json) {
    return VerificationRequestDetails(
      id: json['id'] is int ? json['id'] : 0,
      status: json['status'] ?? 'unknown',
      businessName: json['businessName'],
      fullName: json['fullName'],
      rejectionReason: json['rejectionReason'],
      durationDays: json['durationDays'],
      createdAt: json['createdAt'],
      paymentStatus: json['paymentStatus'],
      paymentAmount: json['paymentAmount'] != null ? (json['paymentAmount'] as num).toDouble() : null,
      canResubmitFree: json['canResubmitFree'] == true,
    );
  }
}

class VerificationUploadResponse {
  final bool success;
  final String? error;
  final Map<String, dynamic>? data; 
  // data might contain 'url', 'filename' etc.
  
  VerificationUploadResponse({
    required this.success,
    this.error,
    this.data,
  });

  factory VerificationUploadResponse.fromJson(Map<String, dynamic> json) {
    return VerificationUploadResponse(
      success: json['success'] == true,
      error: json['message'],
      data: json['data'],
    );
  }
}

class VerificationSubmitResponse {
  final bool success;
  final String? error;
  final String? message;
  final int? requestId;

  VerificationSubmitResponse({
    required this.success,
    this.error,
    this.message,
    this.requestId,
  });

  factory VerificationSubmitResponse.fromJson(Map<String, dynamic> json) {
    return VerificationSubmitResponse(
      success: json['success'] == true,
      error: json['success'] == true ? null : json['message'],
      message: json['message'] as String?,
      requestId: json['data']?['requestId'] as int?,
    );
  }
}

class VerificationPricingResponse {
  final List<PricingOption> individual;
  final List<PricingOption> business;
  final FreeVerificationInfo freeVerification;
  final VerificationCampaign? campaign;

  VerificationPricingResponse({
    required this.individual,
    required this.business,
    required this.freeVerification,
    this.campaign,
  });

  factory VerificationPricingResponse.fromJson(Map<String, dynamic> json) {
    return VerificationPricingResponse(
      individual: (json['individual'] as List<dynamic>?)
              ?.map((e) => PricingOption.fromJson(e))
              .toList() ??
          [],
      business: (json['business'] as List<dynamic>?)
              ?.map((e) => PricingOption.fromJson(e))
              .toList() ??
          [],
      freeVerification: FreeVerificationInfo.fromJson(
          json['freeVerification'] ?? {}),
      campaign: json['campaign'] != null
          ? VerificationCampaign.fromJson(json['campaign'])
          : null,
    );
  }
}

class PricingOption {
  final int id;
  final int durationDays;
  final String durationLabel;
  final double price;
  final double discountPercentage;
  final double finalPrice;
  final bool hasCampaignDiscount;

  PricingOption({
    required this.id,
    required this.durationDays,
    required this.durationLabel,
    required this.price,
    required this.discountPercentage,
    required this.finalPrice,
    required this.hasCampaignDiscount,
  });

  factory PricingOption.fromJson(Map<String, dynamic> json) {
    return PricingOption(
      id: json['id'] ?? 0,
      durationDays: json['durationDays'] ?? 0,
      durationLabel: json['durationLabel'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      discountPercentage:
          (json['discountPercentage'] as num?)?.toDouble() ?? 0,
      finalPrice: (json['finalPrice'] as num?)?.toDouble() ?? 0,
      hasCampaignDiscount: json['hasCampaignDiscount'] == true,
    );
  }
}

class FreeVerificationInfo {
  final bool enabled;
  final int durationDays;
  final List<String> types;
  final bool isEligible;

  FreeVerificationInfo({
    required this.enabled,
    required this.durationDays,
    required this.types,
    required this.isEligible,
  });

  factory FreeVerificationInfo.fromJson(Map<String, dynamic> json) {
    return FreeVerificationInfo(
      enabled: json['enabled'] == true,
      durationDays: json['durationDays'] ?? 180,
      types: (json['types'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          ['individual', 'business'],
      isEligible: json['isEligible'] == true,
    );
  }
}

class VerificationCampaign {
  final int id;
  final String name;
  final String? description;
  final double discountPercentage;
  final String bannerText;
  final String? bannerEmoji;
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
    required this.daysRemaining,
    required this.appliesToTypes,
    this.minDurationDays,
  });

  factory VerificationCampaign.fromJson(Map<String, dynamic> json) {
    return VerificationCampaign(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      discountPercentage:
          (json['discountPercentage'] as num?)?.toDouble() ?? 0,
      bannerText: json['bannerText'] ?? '',
      bannerEmoji: json['bannerEmoji'],
      daysRemaining: json['daysRemaining'] ?? 0,
      appliesToTypes: (json['appliesToTypes'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      minDurationDays: json['minDurationDays'],
    );
  }
}

