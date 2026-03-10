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
      onError: (DioException e, handler) {
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
