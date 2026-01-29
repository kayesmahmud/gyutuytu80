import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import '../models/payment.dart';
import 'api_config.dart';

/// Payment API Client - handles payment-related API calls
class PaymentClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: ApiConfig.connectTimeout,
    receiveTimeout: ApiConfig.receiveTimeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  PaymentClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("PaymentClient Error: ${e.message}");
        if (e.response != null) {
          print("Response Data: ${e.response?.data}");
        }
        return handler.next(e);
      },
    ));
  }

  // ==========================================
  // AVAILABLE GATEWAYS
  // ==========================================

  /// Get available payment gateways
  Future<ApiResponse<List<GatewayInfo>>> getAvailableGateways() async {
    try {
      final response = await _dio.get('/payments/gateways');

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        return ApiResponse.success(
          data.map((e) => GatewayInfo.fromJson(e as Map<String, dynamic>)).toList(),
        );
      }
      return ApiResponse.failure(response.data['message'] ?? 'Failed to fetch gateways');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to fetch payment gateways',
      );
    }
  }

  // ==========================================
  // INITIATE PAYMENT
  // ==========================================

  /// Initiate a payment
  ///
  /// Parameters:
  /// - gateway: Payment gateway (khalti or esewa)
  /// - amount: Amount in NPR (minimum 10)
  /// - paymentType: Type of payment
  /// - relatedId: Related entity ID (e.g., ad ID for promotions)
  /// - orderName: Display name for the order
  /// - returnUrl: URL to return to after payment (for mobile, use deep link)
  /// - metadata: Additional metadata
  Future<ApiResponse<PaymentInitiateResponse>> initiatePayment({
    required PaymentGateway gateway,
    required double amount,
    required PaymentType paymentType,
    int? relatedId,
    required String orderName,
    String? returnUrl,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _dio.post('/payments/initiate', data: {
        'gateway': gateway.apiValue,
        'amount': amount,
        'paymentType': paymentType.apiValue,
        'relatedId': relatedId,
        'orderName': orderName,
        'returnUrl': returnUrl ?? _getDefaultReturnUrl(),
        'metadata': metadata,
      });

      if (response.data['success'] == true) {
        return ApiResponse.success(
          PaymentInitiateResponse.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['message'] ?? 'Failed to initiate payment');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return ApiResponse.failure('Authentication required');
      }
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to initiate payment',
      );
    }
  }

  // ==========================================
  // VERIFY PAYMENT
  // ==========================================

  /// Verify a payment after completion
  ///
  /// Parameters:
  /// - transactionId: Our transaction ID
  /// - pidx: Khalti payment index (for Khalti payments)
  /// - esewaData: eSewa callback data (for eSewa payments)
  Future<ApiResponse<PaymentVerifyResponse>> verifyPayment({
    required String transactionId,
    String? pidx,
    String? esewaData,
  }) async {
    try {
      final response = await _dio.post('/payments/verify', data: {
        'transactionId': transactionId,
        'pidx': pidx,
        'esewaData': esewaData,
      });

      if (response.data['success'] == true) {
        return ApiResponse.success(
          PaymentVerifyResponse.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['message'] ?? 'Payment verification failed');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return ApiResponse.failure('Authentication required');
      }
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to verify payment',
      );
    }
  }

  // ==========================================
  // GET PAYMENT STATUS
  // ==========================================

  /// Get status of a specific payment
  Future<ApiResponse<PaymentTransaction>> getPaymentStatus(String transactionId) async {
    try {
      final response = await _dio.get('/payments/status/$transactionId');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          PaymentTransaction.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['message'] ?? 'Failed to fetch payment status');
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return ApiResponse.failure('Transaction not found');
      }
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to fetch payment status',
      );
    }
  }

  // ==========================================
  // PAYMENT HISTORY
  // ==========================================

  /// Get user's payment history
  Future<PaginatedResponse<PaymentTransaction>> getPaymentHistory({
    int page = 1,
    int limit = 20,
    String? status,
    String? type,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (status != null) queryParams['status'] = status;
      if (type != null) queryParams['type'] = type;

      final response = await _dio.get('/payments/history', queryParameters: queryParams);

      if (response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>;
        final pagination = response.data['pagination'] as Map<String, dynamic>?;

        return PaginatedResponse.success(
          data.map((e) => PaymentTransaction.fromJson(e as Map<String, dynamic>)).toList(),
          pagination != null
              ? PaginationInfo(
                  page: pagination['page'] as int? ?? page,
                  limit: pagination['limit'] as int? ?? limit,
                  total: pagination['total'] as int? ?? data.length,
                  totalPages: pagination['totalPages'] as int? ?? 1,
                )
              : PaginationInfo(page: 1, limit: data.length, total: data.length, totalPages: 1),
        );
      }
      return PaginatedResponse.failure(response.data['message'] ?? 'Failed to fetch payment history');
    } on DioException catch (e) {
      return PaginatedResponse.failure(
        e.response?.data?['message'] ?? 'Failed to fetch payment history',
      );
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /// Get default return URL for mobile (uses API callback)
  String _getDefaultReturnUrl() {
    // The API will redirect to web success/failure pages
    // Mobile app should handle the deep link or poll for status
    return '${ApiConfig.baseUrl}/payments/callback';
  }

  /// Parse callback URL parameters to get payment result
  static Map<String, String> parseCallbackUrl(String url) {
    final uri = Uri.parse(url);
    return uri.queryParameters;
  }

  /// Check if URL is a payment callback
  static bool isPaymentCallback(String url) {
    return url.contains('/payment/success') ||
        url.contains('/payment/failure') ||
        url.contains('/payments/callback');
  }

  /// Check if payment was successful from callback URL
  static bool isPaymentSuccess(String url) {
    return url.contains('/payment/success');
  }
}
