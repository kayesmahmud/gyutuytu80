import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/models.dart';
import '../models/verification.dart';
import 'api_config.dart';

/// Verification API Client - handles verification-related API calls
class VerificationClient {
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

  VerificationClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("VerificationClient Error: ${e.message}");
        if (e.response != null) {
          print("Response Data: ${e.response?.data}");
        }
        return handler.next(e);
      },
    ));
  }

  // ==========================================
  // VERIFICATION STATUS
  // ==========================================

  /// Get current user's verification status (both business and individual)
  Future<ApiResponse<VerificationStatusResponse>> getVerificationStatus() async {
    try {
      final response = await _dio.get('/verification/status');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          VerificationStatusResponse.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['message'] ?? 'Failed to fetch verification status');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return ApiResponse.failure('Authentication required');
      }
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to fetch verification status',
      );
    }
  }

  // ==========================================
  // VERIFICATION PRICING
  // ==========================================

  /// Get verification pricing (public, but checks user eligibility for free verification)
  Future<ApiResponse<VerificationPricing>> getVerificationPricing() async {
    try {
      final response = await _dio.get('/verification/pricing');

      if (response.data['success'] == true) {
        return ApiResponse.success(
          VerificationPricing.fromJson(response.data['data'] as Map<String, dynamic>),
        );
      }
      return ApiResponse.failure(response.data['message'] ?? 'Failed to fetch pricing');
    } on DioException catch (e) {
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to fetch verification pricing',
      );
    }
  }

  // ==========================================
  // SUBMIT INDIVIDUAL VERIFICATION
  // ==========================================

  /// Submit individual verification request
  ///
  /// Required parameters:
  /// - fullName: User's full name
  /// - idDocumentType: 'citizenship' | 'passport' | 'driving_license'
  /// - idDocumentFrontPath: Path to ID front image file
  /// - selfieWithIdPath: Path to selfie with ID image file
  /// - durationDays: 30 | 90 | 180 | 365
  /// - paymentAmount: Price from verification_pricing
  /// - paymentReference: Payment reference number
  ///
  /// Optional:
  /// - idDocumentNumber: Document number
  /// - idDocumentBackPath: Path to ID back image file
  /// - isFree: Set to true for free verification
  Future<ApiResponse<Map<String, dynamic>>> submitIndividualVerification({
    required String fullName,
    required String idDocumentType,
    required String idDocumentFrontPath,
    required String selfieWithIdPath,
    String? idDocumentBackPath,
    String? idDocumentNumber,
    required int durationDays,
    required double paymentAmount,
    required String paymentReference,
    bool isFree = false,
  }) async {
    try {
      final formData = FormData.fromMap({
        'full_name': fullName,
        'id_document_type': idDocumentType,
        'id_document_number': idDocumentNumber ?? '',
        'duration_days': durationDays,
        'payment_amount': paymentAmount,
        'payment_reference': paymentReference,
        'payment_status': isFree ? 'free' : 'pending',
        'id_document_front': await MultipartFile.fromFile(
          idDocumentFrontPath,
          filename: 'id_front.jpg',
        ),
        'selfie_with_id': await MultipartFile.fromFile(
          selfieWithIdPath,
          filename: 'selfie.jpg',
        ),
      });

      if (idDocumentBackPath != null) {
        formData.files.add(MapEntry(
          'id_document_back',
          await MultipartFile.fromFile(
            idDocumentBackPath,
            filename: 'id_back.jpg',
          ),
        ));
      }

      final response = await _dio.post(
        '/verification/individual',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(response.data['data'] as Map<String, dynamic>);
      }
      return ApiResponse.failure(response.data['message'] ?? 'Failed to submit verification');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return ApiResponse.failure('Authentication required');
      }
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to submit individual verification',
      );
    }
  }

  // ==========================================
  // SUBMIT BUSINESS VERIFICATION
  // ==========================================

  /// Submit business verification request
  ///
  /// Required parameters:
  /// - businessName: Business name
  /// - businessLicenseDocPath: Path to business license document file
  /// - durationDays: 30 | 90 | 180 | 365
  /// - paymentAmount: Price from verification_pricing
  /// - paymentReference: Payment reference number
  ///
  /// Optional:
  /// - businessCategory: Business category
  /// - businessDescription: Business description
  /// - businessWebsite: Business website URL
  /// - businessPhone: Business phone number
  /// - businessAddress: Business address
  /// - isFree: Set to true for free verification
  Future<ApiResponse<Map<String, dynamic>>> submitBusinessVerification({
    required String businessName,
    required String businessLicenseDocPath,
    String? businessCategory,
    String? businessDescription,
    String? businessWebsite,
    String? businessPhone,
    String? businessAddress,
    required int durationDays,
    required double paymentAmount,
    required String paymentReference,
    bool isFree = false,
  }) async {
    try {
      final formData = FormData.fromMap({
        'business_name': businessName,
        'business_category': businessCategory ?? '',
        'business_description': businessDescription ?? '',
        'business_website': businessWebsite ?? '',
        'business_phone': businessPhone ?? '',
        'business_address': businessAddress ?? '',
        'duration_days': durationDays,
        'payment_amount': paymentAmount,
        'payment_reference': paymentReference,
        'payment_status': isFree ? 'free' : 'pending',
        'business_license_document': await MultipartFile.fromFile(
          businessLicenseDocPath,
          filename: 'business_license.jpg',
        ),
      });

      final response = await _dio.post(
        '/verification/business',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );

      if (response.data['success'] == true) {
        return ApiResponse.success(response.data['data'] as Map<String, dynamic>);
      }
      return ApiResponse.failure(response.data['message'] ?? 'Failed to submit verification');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return ApiResponse.failure('Authentication required');
      }
      return ApiResponse.failure(
        e.response?.data?['message'] ?? 'Failed to submit business verification',
      );
    }
  }
}
