import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dio_client.dart';

class AuthClient {
  final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthClient({Dio? dio}) : _dio = dio ?? DioClient.instance.dio;

  // ==========================================
  // PROFILE ENDPOINTS (/api/profile/*)
  // ==========================================

  // Get Profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get('/profile');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Update Profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _dio.put('/profile', data: data);
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ==========================================
  // AUTH ENDPOINTS (/api/auth/*)
  // ==========================================

  // Send OTP
  Future<Map<String, dynamic>> sendOtp(String phone, {String purpose = 'registration'}) async {
    try {
      final response = await _dio.post('/auth/send-otp', data: {
        'phone': phone,
        'purpose': purpose,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Verify OTP
  Future<Map<String, dynamic>> verifyOtp(String phone, String otp, {String purpose = 'registration'}) async {
    try {
      final response = await _dio.post('/auth/verify-otp', data: {
        'phone': phone,
        'otp': otp,
        'purpose': purpose,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Phone Login
  Future<Map<String, dynamic>> login(String phone, String password) async {
    try {
      final response = await _dio.post('/auth/phone-login', data: {
        'phone': phone,
        'password': password,
      });

      if (response.data['success'] == true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Phone Registration
  Future<Map<String, dynamic>> register(String phone, String password, String fullName, String verificationToken) async {
    try {
      final response = await _dio.post('/auth/register-phone', data: {
        'phone': phone,
        'password': password,
        'fullName': fullName,
        'verificationToken': verificationToken,
      });

      if (response.data['success'] == true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Google Login
  Future<Map<String, dynamic>> googleLogin(String idToken) async {
    try {
      final response = await _dio.post('/auth/google-token', data: {
        'idToken': idToken,
      });

      if (response.data['success'] == true) {
        await _saveTokens(response.data);
      }

      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }


  // ==========================================
  // SECURITY ENDPOINTS (/api/auth)
  // ==========================================

  // Change Password
  Future<Map<String, dynamic>> changePassword(String currentPassword, String newPassword) async {
    try {
      final response = await _dio.post('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Update Phone
  Future<Map<String, dynamic>> updatePhone(String phone, String verificationToken) async {
    try {
      final response = await _dio.post('/auth/update-phone', data: {
        'phone': phone,
        'verificationToken': verificationToken,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Get Active Sessions
  Future<Map<String, dynamic>> getSessions() async {
    try {
      final response = await _dio.get('/auth/sessions');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Revoke Session
  Future<Map<String, dynamic>> revokeSession(int sessionId) async {
    try {
      final response = await _dio.delete('/auth/sessions/$sessionId');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Toggle 2FA
  Future<Map<String, dynamic>> toggle2FA(bool enable) async {
    try {
      final response = await _dio.post('/auth/2fa/toggle', data: {
        'enable': enable,
      });
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  // Helper: Save Tokens
  Future<void> _saveTokens(Map<String, dynamic> data) async {
    if (data['token'] != null) {
      await _storage.write(key: 'auth_token', value: data['token']);
    }
    if (data['refreshToken'] != null) {
      await _storage.write(key: 'refresh_token', value: data['refreshToken']);
    }
  }

  // Helper: Handle Error
  Map<String, dynamic> _handleError(DioException e) {
    if (e.response != null) {
      return e.response!.data as Map<String, dynamic>;
    }
    return {
      'success': false,
      'message': 'Network error occurred. Please check your connection.',
    };
  }

  // Get Token
  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  // Logout
  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'refresh_token');
  }
}
