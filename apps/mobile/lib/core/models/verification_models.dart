
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

  VerificationSubmitResponse({
    required this.success,
    this.error,
    this.message,
  });

  factory VerificationSubmitResponse.fromJson(Map<String, dynamic> json) {
    return VerificationSubmitResponse(
      success: json['success'] == true,
      error: json['success'] == true ? null : json['message'],
      message: json['message'] as String?,
    );
  }
}

class VerificationPricing {
  final Map<String, VerificationPlan> individual;
  final Map<String, VerificationPlan> business;
  final Discount? activeCampaign;
  final bool userEligibleForFree;

  VerificationPricing({
    required this.individual,
    required this.business,
    this.activeCampaign,
    required this.userEligibleForFree,
  });

  factory VerificationPricing.fromJson(Map<String, dynamic> json) {
    return VerificationPricing(
      individual: (json['individual'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, VerificationPlan.fromJson(value)),
      ),
      business: (json['business'] as Map<String, dynamic>).map(
        (key, value) => MapEntry(key, VerificationPlan.fromJson(value)),
      ),
      activeCampaign: json['activeCampaign'] != null
          ? Discount.fromJson(json['activeCampaign'])
          : null,
      userEligibleForFree: json['userEligibleForFree'] == true,
    );
  }
}

class VerificationPlan {
  final int durationDays;
  final num price;
  final num? discountedPrice;
  final num? finalPrice;
  final bool isFree;

  VerificationPlan({
    required this.durationDays,
    required this.price,
    this.discountedPrice,
    this.finalPrice,
    required this.isFree,
  });

  factory VerificationPlan.fromJson(Map<String, dynamic> json) {
    return VerificationPlan(
      durationDays: json['durationDays'] ?? 0,
      price: json['price'] ?? 0,
      discountedPrice: json['discountedPrice'],
      finalPrice: json['finalPrice'],
      isFree: json['isFree'] == true,
    );
  }
}

class Discount {
  final String name;
  final String type;
  final num value;

  Discount({
    required this.name,
    required this.type,
    required this.value,
  });

  factory Discount.fromJson(Map<String, dynamic> json) {
    return Discount(
      name: json['name'] ?? '',
      type: json['type'] ?? '',
      value: json['value'] ?? 0,
    );
  }
}
