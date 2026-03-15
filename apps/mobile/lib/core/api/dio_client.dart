import 'dart:developer' as developer;
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'api_config.dart';

/// Shared Dio instance for all API clients.
/// Provides auth interceptor, error logging, and SSL certificate pinning.
class DioClient {
  static final DioClient _instance = DioClient._();
  static DioClient get instance => _instance;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  DioClient._() {
    dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401 &&
            !e.requestOptions.path.contains('/auth/')) {
          // Try refreshing the token
          final newToken = await _tryRefreshToken();
          if (newToken != null) {
            // Retry the original request with the new token
            e.requestOptions.headers['Authorization'] = 'Bearer $newToken';
            try {
              final response = await dio.fetch(e.requestOptions);
              return handler.resolve(response);
            } catch (retryError) {
              // Retry failed — pass through
            }
          }
        }
        if (kDebugMode) {
          developer.log(
            'DioError: ${e.message}',
            name: 'DioClient',
            error: e.response?.data,
          );
        }
        return handler.next(e);
      },
    ));
  }

  bool _isRefreshing = false;

  Future<String?> _tryRefreshToken() async {
    if (_isRefreshing) return null;
    _isRefreshing = true;
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return null;

      // Use a separate Dio instance to avoid interceptor loop
      final refreshDio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));
      final response = await refreshDio.post(
        '/auth/refresh-token',
        data: {'refreshToken': refreshToken},
      );

      final data = response.data;
      if (data['success'] == true && data['data'] != null) {
        final newToken = data['data']['token'] as String;
        final newRefresh = data['data']['refreshToken'] as String?;
        await _storage.write(key: 'auth_token', value: newToken);
        if (newRefresh != null) {
          await _storage.write(key: 'refresh_token', value: newRefresh);
        }
        developer.log('Token refreshed successfully', name: 'DioClient');
        return newToken;
      }
    } catch (e) {
      developer.log('Token refresh failed: $e', name: 'DioClient');
    } finally {
      _isRefreshing = false;
    }
    return null;
  }

  /// Call once at app startup (before any API calls) to activate SSL pinning.
  ///
  /// Loads the pinned certificate from [assets/certs/api_thulobazaar.pem].
  /// If the file is missing (e.g. dev environment), pinning is silently skipped.
  /// Skipped on web — only applies on iOS and Android.
  ///
  /// See [assets/certs/README.md] for instructions on obtaining the cert.
  static Future<void> ensureInitialized() async {
    // SSL pinning only applies on mobile platforms
    if (kIsWeb || !(Platform.isAndroid || Platform.isIOS)) return;

    try {
      final certBytes =
          await rootBundle.load('assets/certs/api_thulobazaar.pem');
      final securityContext = SecurityContext()
        ..setTrustedCertificatesBytes(certBytes.buffer.asUint8List());

      (_instance.dio.httpClientAdapter as IOHttpClientAdapter)
          .createHttpClient = () => HttpClient(context: securityContext);

      developer.log('SSL pinning active', name: 'DioClient');
    } catch (e) {
      // Cert file missing in dev builds — continue without pinning.
      // In production, ensure assets/certs/api_thulobazaar.pem exists.
      developer.log('SSL pinning skipped: $e', name: 'DioClient');
    }
  }
}
