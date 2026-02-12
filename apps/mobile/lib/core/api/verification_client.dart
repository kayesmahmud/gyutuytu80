import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';
import '../models/verification_models.dart';

class VerificationClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  VerificationClient() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
  }

  Future<String?> _getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  /// Get current user's verification status
  Future<VerificationStatusResponse> getVerificationStatus() async {
    try {
      final token = await _getToken();
      if (token == null) {
        return VerificationStatusResponse(success: false, error: 'Not authenticated');
      }

      final response = await _dio.get(
        '/verification/status',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.data['success'] == true) {
        return VerificationStatusResponse.fromJson(response.data);
      }

      return VerificationStatusResponse(
        success: false,
        error: response.data['message'] ?? 'Failed to fetch status',
      );
    } on DioException catch (e) {
      return VerificationStatusResponse(
        success: false,
        error: e.response?.data?['message'] ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationStatusResponse(success: false, error: e.toString());
    }
  }

  /// Upload business verification document
  Future<VerificationUploadResponse> uploadBusinessDocument(File file) async {
    try {
      final token = await _getToken();
      if (token == null) {
        return VerificationUploadResponse(success: false, error: 'Not authenticated');
      }

      String fileName = file.path.split('/').last;
      FormData formData = FormData.fromMap({
        'business_license_document': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      });

      final response = await _dio.post(
        '/verification/business/upload',
        data: formData,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.data['success'] == true) {
        return VerificationUploadResponse.fromJson(response.data);
      }

      return VerificationUploadResponse(
        success: false,
        error: response.data['message'] ?? 'Upload failed',
      );
    } on DioException catch (e) {
      return VerificationUploadResponse(
        success: false,
        error: e.response?.data?['message'] ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationUploadResponse(success: false, error: e.toString());
    }
  }

  /// Upload individual verification documents
  Future<VerificationUploadResponse> uploadIndividualDocuments({
    required File idFront,
    File? idBack,
    required File selfie,
    String idType = 'citizenship',
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        return VerificationUploadResponse(success: false, error: 'Not authenticated');
      }

      final Map<String, dynamic> fileMap = {};

      fileMap['id_document_front'] = await MultipartFile.fromFile(
        idFront.path,
        filename: idFront.path.split('/').last,
      );

      if (idBack != null) {
        fileMap['id_document_back'] = await MultipartFile.fromFile(
          idBack.path,
          filename: idBack.path.split('/').last,
        );
      }

      fileMap['selfie_with_id'] = await MultipartFile.fromFile(
        selfie.path,
        filename: selfie.path.split('/').last,
      );

      FormData formData = FormData.fromMap(fileMap);

      final response = await _dio.post(
        '/verification/individual/upload',
        data: formData,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.data['success'] == true) {
        return VerificationUploadResponse.fromJson(response.data);
      }

      return VerificationUploadResponse(
        success: false,
        error: response.data['message'] ?? 'Upload failed',
      );
    } on DioException catch (e) {
      return VerificationUploadResponse(
        success: false,
        error: e.response?.data?['message'] ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationUploadResponse(success: false, error: e.toString());
    }
  }

  /// Submit business verification request
  Future<VerificationSubmitResponse> submitBusinessVerification({
    required String businessName,
    required String licenseDocument,
    String? businessCategory,
    String? businessDescription,
    String? businessWebsite,
    String? businessPhone,
    String? businessAddress,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        return VerificationSubmitResponse(success: false, error: 'Not authenticated');
      }

      final data = {
        'businessName': businessName,
        'licenseDocument': licenseDocument,
        if (businessCategory != null) 'businessCategory': businessCategory,
        if (businessDescription != null) 'businessDescription': businessDescription,
        if (businessWebsite != null) 'businessWebsite': businessWebsite,
        if (businessPhone != null) 'businessPhone': businessPhone,
        if (businessAddress != null) 'businessAddress': businessAddress,
      };

      final response = await _dio.post(
        '/verification/business',
        data: data,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.data['success'] == true) {
        return VerificationSubmitResponse.fromJson(response.data);
      }

      return VerificationSubmitResponse(
        success: false,
        error: response.data['message'] ?? 'Submission failed',
      );
    } on DioException catch (e) {
      return VerificationSubmitResponse(
        success: false,
        error: e.response?.data?['message'] ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationSubmitResponse(success: false, error: e.toString());
    }
  }

  /// Submit individual verification request
  Future<VerificationSubmitResponse> submitIndividualVerification({
    required Map<String, dynamic> documentUrls,
    required String fullName,
    required String idType, // 'citizenship', 'passport', 'driving_license'
    required String idNumber,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        return VerificationSubmitResponse(success: false, error: 'Not authenticated');
      }

      final data = {
        'documentUrls': documentUrls,
        'fullName': fullName,
        'idDocumentType': idType,
        'idDocumentNumber': idNumber,
      };

      final response = await _dio.post(
        '/verification/individual',
        data: data,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );

      if (response.data['success'] == true) {
        return VerificationSubmitResponse.fromJson(response.data);
      }

      return VerificationSubmitResponse(
        success: false,
        error: response.data['message'] ?? 'Submission failed',
      );
    } on DioException catch (e) {
      return VerificationSubmitResponse(
        success: false,
        error: e.response?.data?['message'] ?? e.message ?? 'Network error',
      );
    } catch (e) {
      return VerificationSubmitResponse(success: false, error: e.toString());
    }
  }
}
