import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

class AuthClient {
  // Auth-specific endpoints
  static String get authUrl => '${ApiConfig.baseUrl}/auth';

  final Dio _authDio;  // For /api/auth/* endpoints
  final Dio _profileDio;  // For /api/profile/* endpoints

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  AuthClient()
      : _authDio = Dio(BaseOptions(
          baseUrl: '${ApiConfig.baseUrl}/auth',
          connectTimeout: ApiConfig.connectTimeout,
          receiveTimeout: ApiConfig.receiveTimeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )),
        _profileDio = Dio(BaseOptions(
          baseUrl: '${ApiConfig.baseUrl}/profile',
          connectTimeout: ApiConfig.connectTimeout,
          receiveTimeout: ApiConfig.receiveTimeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        )) {
    // Add auth interceptor to both
    _addInterceptors(_authDio);
    _addInterceptors(_profileDio);
  }

  void _addInterceptors(Dio dio) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  // ==========================================
  // PROFILE ENDPOINTS (/api/profile/*)
  // ==========================================

  // Get Profile
  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _profileDio.get('/');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Update Profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    try {
      final response = await _profileDio.put('/', data: data);
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
      final response = await _authDio.post('/send-otp', data: {
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
      final response = await _authDio.post('/verify-otp', data: {
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
      final response = await _authDio.post('/phone-login', data: {
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
      final response = await _authDio.post('/register-phone', data: {
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
      final response = await _authDio.post('/google-token', data: {
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
      final response = await _authDio.post('/change-password', data: {
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
      final response = await _authDio.post('/update-phone', data: {
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
      final response = await _authDio.get('/sessions');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Revoke Session
  Future<Map<String, dynamic>> revokeSession(int sessionId) async {
    try {
      final response = await _authDio.delete('/sessions/$sessionId');
      return response.data;
    } on DioException catch (e) {
      return _handleError(e);
    }
  }

  // Toggle 2FA
  Future<Map<String, dynamic>> toggle2FA(bool enable) async {
    try {
      final response = await _authDio.post('/2fa/toggle', data: {
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
