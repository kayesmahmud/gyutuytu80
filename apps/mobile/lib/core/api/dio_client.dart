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

  /// Called when token refresh fails on a 401 — listeners should clear auth state.
  static void Function()? onAuthFailure;

  late final Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // In-memory cache of the auth token. Reading secure storage on EVERY request
  // (the home screen alone fires many in parallel) floods the Android main
  // thread message queue and can ANR / make token reads lag and return null.
  // We read storage once, then serve from memory; [updateAuthToken] keeps it in
  // sync on login / refresh / logout.
  static String? _cachedAuthToken;
  static bool _authTokenLoaded = false;

  /// Keep the in-memory auth-token cache in sync. Call on login, token refresh,
  /// and logout. Pass null to clear it.
  static void updateAuthToken(String? token) {
    _cachedAuthToken = token;
    _authTokenLoaded = true;
  }

  DioClient._() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        sendTimeout: ApiConfig.sendTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (!_authTokenLoaded) {
            // Cold start: read secure storage once, then serve from memory.
            _cachedAuthToken = await _storage.read(key: 'auth_token');
            _authTokenLoaded = true;
          }
          final token = _cachedAuthToken;
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
            } else {
              // Refresh failed — clear tokens and notify auth failure
              await _storage.delete(key: 'auth_token');
              await _storage.delete(key: 'refresh_token');
              updateAuthToken(null);
              onAuthFailure?.call();
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
      ),
    );
  }

  Future<String?>? _refreshInFlight;

  /// Refresh the access token. Concurrent callers (e.g. many home-screen
  /// requests 401-ing at once) all await the SAME in-flight refresh and receive
  /// its result — so a successful refresh is never mistaken for a failure (which
  /// would wrongly clear tokens and log the user out). Returns null only on a
  /// genuine refresh failure (no refresh token, or the refresh call failed).
  Future<String?> _tryRefreshToken() {
    return _refreshInFlight ??= _doRefreshToken().whenComplete(
      () => _refreshInFlight = null,
    );
  }

  Future<String?> _doRefreshToken() async {
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
        updateAuthToken(newToken);
        developer.log('Token refreshed successfully', name: 'DioClient');
        return newToken;
      }
    } catch (e) {
      developer.log('Token refresh failed: $e', name: 'DioClient');
    }
    return null;
  }

  /// Call once at app startup (before any API calls) to activate SSL pinning.
  ///
  /// Loads pinned certificates from [assets/certs/api_thulobazaar.pem]. The API
  /// sits behind Cloudflare, whose edge certificate rotates (~90-day Let's
  /// Encrypt). To avoid an outage on every rotation, we pin the long-lived
  /// Let's Encrypt ROOTS (ISRG Root X1, exp 2035 + ISRG Root X2, exp 2040) —
  /// NOT a leaf or intermediate. Do not replace these with a leaf/intermediate
  /// cert: it will hard-break every release once Cloudflare rotates.
  ///
  /// If the file is missing (e.g. dev environment), pinning is silently skipped.
  /// Skipped on web — only applies on iOS and Android.
  ///
  /// See [assets/certs/README.md] for how to refresh these roots.
  static Future<void> ensureInitialized() async {
    // SSL pinning only applies on mobile platforms
    if (kIsWeb || !(Platform.isAndroid || Platform.isIOS)) return;

    try {
      final certBytes = await rootBundle.load(
        'assets/certs/api_thulobazaar.pem',
      );
      final securityContext = SecurityContext()
        ..setTrustedCertificatesBytes(certBytes.buffer.asUint8List());

      (_instance.dio.httpClientAdapter as IOHttpClientAdapter)
          .createHttpClient = () =>
          HttpClient(context: securityContext);

      developer.log('SSL pinning active', name: 'DioClient');
    } catch (e) {
      // Cert file missing in dev builds — continue without pinning.
      // In production, ensure assets/certs/api_thulobazaar.pem exists.
      developer.log('SSL pinning skipped: $e', name: 'DioClient');
    }
  }
}
