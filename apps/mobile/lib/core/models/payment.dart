/// Payment models - mirrors TypeScript payment types

// ==========================================
// PAYMENT TYPES
// ==========================================

enum PaymentGateway { khalti, esewa }

enum PaymentType { adPromotion, individualVerification, businessVerification }

enum PaymentStatus { pending, completed, failed, expired, refunded, canceled, verified }

/// Extension to convert enum to API string
extension PaymentGatewayExt on PaymentGateway {
  String get apiValue {
    switch (this) {
      case PaymentGateway.khalti:
        return 'khalti';
      case PaymentGateway.esewa:
        return 'esewa';
    }
  }

  String get displayName {
    switch (this) {
      case PaymentGateway.khalti:
        return 'Khalti';
      case PaymentGateway.esewa:
        return 'eSewa';
    }
  }
}

extension PaymentTypeExt on PaymentType {
  String get apiValue {
    switch (this) {
      case PaymentType.adPromotion:
        return 'ad_promotion';
      case PaymentType.individualVerification:
        return 'individual_verification';
      case PaymentType.businessVerification:
        return 'business_verification';
    }
  }

  String get displayName {
    switch (this) {
      case PaymentType.adPromotion:
        return 'Ad Promotion';
      case PaymentType.individualVerification:
        return 'Individual Verification';
      case PaymentType.businessVerification:
        return 'Business Verification';
    }
  }
}

// ==========================================
// PAYMENT INITIATE RESPONSE
// ==========================================

/// Response from payment initiation
class PaymentInitiateResponse {
  final String transactionId;
  final String paymentUrl;
  final String? pidx; // Khalti specific
  final String? expiresAt;
  final PaymentGateway gateway;

  PaymentInitiateResponse({
    required this.transactionId,
    required this.paymentUrl,
    this.pidx,
    this.expiresAt,
    required this.gateway,
  });

  factory PaymentInitiateResponse.fromJson(Map<String, dynamic> json) {
    return PaymentInitiateResponse(
      transactionId: json['transactionId'] as String? ?? json['transaction_id'] as String? ?? '',
      paymentUrl: json['paymentUrl'] as String? ?? json['payment_url'] as String? ?? '',
      pidx: json['pidx'] as String?,
      expiresAt: json['expiresAt'] as String? ?? json['expires_at'] as String?,
      gateway: _parseGateway(json['gateway']),
    );
  }
}

// ==========================================
// PAYMENT VERIFY RESPONSE
// ==========================================

/// Response from payment verification
class PaymentVerifyResponse {
  final PaymentStatus status;
  final String transactionId;
  final double amount;
  final PaymentGateway gateway;
  final String? gatewayTransactionId;
  final DateTime? verifiedAt;

  PaymentVerifyResponse({
    required this.status,
    required this.transactionId,
    required this.amount,
    required this.gateway,
    this.gatewayTransactionId,
    this.verifiedAt,
  });

  factory PaymentVerifyResponse.fromJson(Map<String, dynamic> json) {
    return PaymentVerifyResponse(
      status: _parseStatus(json['status']),
      transactionId: json['transactionId'] as String? ?? json['transaction_id'] as String? ?? '',
      amount: _parseDouble(json['amount']),
      gateway: _parseGateway(json['gateway']),
      gatewayTransactionId: json['gatewayTransactionId'] as String? ?? json['gateway_transaction_id'] as String?,
      verifiedAt: _parseDateTimeNullable(json['verifiedAt'] ?? json['verified_at']),
    );
  }

  bool get isSuccess => status == PaymentStatus.verified || status == PaymentStatus.completed;
}

// ==========================================
// PAYMENT TRANSACTION
// ==========================================

/// Full payment transaction record
class PaymentTransaction {
  final String? transactionId;
  final PaymentType type;
  final PaymentGateway gateway;
  final double amount;
  final PaymentStatus status;
  final String orderName;
  final String? paymentUrl;
  final String? referenceId;
  final String? gatewayTransactionId;
  final DateTime createdAt;
  final DateTime? verifiedAt;
  final String? failureReason;

  PaymentTransaction({
    this.transactionId,
    required this.type,
    required this.gateway,
    required this.amount,
    required this.status,
    required this.orderName,
    this.paymentUrl,
    this.referenceId,
    this.gatewayTransactionId,
    required this.createdAt,
    this.verifiedAt,
    this.failureReason,
  });

  factory PaymentTransaction.fromJson(Map<String, dynamic> json) {
    return PaymentTransaction(
      transactionId: json['transactionId'] as String? ?? json['transaction_id'] as String?,
      type: _parsePaymentType(json['paymentType'] ?? json['payment_type'] ?? json['type']),
      gateway: _parseGateway(json['gateway'] ?? json['payment_gateway']),
      amount: _parseDouble(json['amount']),
      status: _parseStatus(json['status']),
      orderName: json['orderName'] as String? ?? json['order_name'] as String? ?? 'Payment',
      paymentUrl: json['paymentUrl'] as String? ?? json['payment_url'] as String?,
      referenceId: json['referenceId'] as String? ?? json['reference_id'] as String?,
      gatewayTransactionId: json['gatewayTransactionId'] as String? ?? json['gateway_transaction_id'] as String?,
      createdAt: _parseDateTime(json['createdAt'] ?? json['created_at']),
      verifiedAt: _parseDateTimeNullable(json['verifiedAt'] ?? json['verified_at']),
      failureReason: json['failureReason'] as String? ?? json['failure_reason'] as String?,
    );
  }

  bool get isPending => status == PaymentStatus.pending;
  bool get isCompleted => status == PaymentStatus.verified || status == PaymentStatus.completed;
  bool get isFailed => status == PaymentStatus.failed || status == PaymentStatus.expired || status == PaymentStatus.canceled;
}

// ==========================================
// AVAILABLE GATEWAY INFO
// ==========================================

/// Gateway configuration
class GatewayInfo {
  final PaymentGateway gateway;
  final String name;
  final String description;
  final bool enabled;
  final bool isTest;

  GatewayInfo({
    required this.gateway,
    required this.name,
    required this.description,
    required this.enabled,
    required this.isTest,
  });

  factory GatewayInfo.fromJson(Map<String, dynamic> json) {
    final gateway = _parseGateway(json['gateway'] ?? json['id']);
    return GatewayInfo(
      gateway: gateway,
      name: json['name'] as String? ?? gateway.displayName,
      description: json['description'] as String? ?? _getDefaultDescription(gateway),
      enabled: json['enabled'] as bool? ?? json['available'] as bool? ?? false,
      isTest: json['isTest'] as bool? ?? json['is_test'] as bool? ?? true,
    );
  }

  static String _getDefaultDescription(PaymentGateway gateway) {
    switch (gateway) {
      case PaymentGateway.khalti:
        return 'Pay with Khalti wallet or bank';
      case PaymentGateway.esewa:
        return 'Pay with eSewa wallet';
    }
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

PaymentGateway _parseGateway(dynamic value) {
  if (value == null) return PaymentGateway.khalti;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'esewa':
      return PaymentGateway.esewa;
    case 'khalti':
    default:
      return PaymentGateway.khalti;
  }
}

PaymentType _parsePaymentType(dynamic value) {
  if (value == null) return PaymentType.adPromotion;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'individual_verification':
      return PaymentType.individualVerification;
    case 'business_verification':
      return PaymentType.businessVerification;
    case 'ad_promotion':
    default:
      return PaymentType.adPromotion;
  }
}

PaymentStatus _parseStatus(dynamic value) {
  if (value == null) return PaymentStatus.pending;
  final str = value.toString().toLowerCase();
  switch (str) {
    case 'completed':
      return PaymentStatus.completed;
    case 'verified':
      return PaymentStatus.verified;
    case 'failed':
      return PaymentStatus.failed;
    case 'expired':
      return PaymentStatus.expired;
    case 'refunded':
      return PaymentStatus.refunded;
    case 'canceled':
      return PaymentStatus.canceled;
    case 'pending':
    default:
      return PaymentStatus.pending;
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

DateTime? _parseDateTimeNullable(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}
