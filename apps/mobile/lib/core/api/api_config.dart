import 'package:flutter/foundation.dart';

/// API Configuration
/// Centralized configuration for API endpoints and URLs
class ApiConfig {
  // Production API. Release/store builds are HARD-LOCKED to this — see [baseUrl].
  static const String _productionUrl = 'https://api.thulobazaar.com.np/api';

  static String get baseUrl {
    // STRICT RULE: every release/store build points at production — ALWAYS.
    // The API_URL override is ignored in release mode, so it is structurally
    // impossible to ship a build aimed at localhost / a dev IP again
    // (root cause of the 1.0.5 outage). Do not weaken this.
    if (kReleaseMode) return _productionUrl;

    // Debug/profile builds only: opt in to a local dev server at run time, e.g.
    //   flutter run --dart-define=API_URL=http://192.168.0.104:5000/api
    // (phone + dev machine on the same WiFi; use your machine's LAN IP).
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return envUrl;

    return _productionUrl;
  }

  // Auth endpoints
  static String get authUrl => '$baseUrl/auth';

  // Image/uploads base URL
  static String get uploadsBaseUrl {
    // Remove trailing /api only (not /api in subdomain like api.thulobazaar.com.np)
    final base = baseUrl.replaceFirst(RegExp(r'/api$'), '');
    return '$base/uploads';
  }

  // Helper to get full avatar URL
  static String getAvatarUrl(String? avatar) {
    if (avatar == null || avatar.isEmpty) return '';
    if (avatar.startsWith('http')) return avatar;
    // If path already contains /uploads/, just prepend the base URL
    if (avatar.startsWith('/uploads/')) {
      final base = baseUrl.replaceFirst(RegExp(r'/api$'), '');
      return '$base$avatar';
    }
    return '$uploadsBaseUrl/avatars/$avatar';
  }

  // Helper to get full ad image URL
  static String getAdImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return '';
    if (imagePath.startsWith('http')) return imagePath;
    // If path already contains /uploads/, just prepend the base URL
    if (imagePath.startsWith('/uploads/')) {
      final base = baseUrl.replaceFirst(RegExp(r'/api$'), '');
      return '$base$imagePath';
    }
    return '$uploadsBaseUrl/ads/$imagePath';
  }

  // Helper to get full cover image URL
  static String getCoverUrl(String? coverPath) {
    if (coverPath == null || coverPath.isEmpty) return '';
    if (coverPath.startsWith('http')) return coverPath;
    // If path already contains /uploads/, just prepend the base URL
    if (coverPath.startsWith('/uploads/')) {
      final base = baseUrl.replaceFirst(RegExp(r'/api$'), '');
      return '$base$coverPath';
    }
    return '$uploadsBaseUrl/covers/$coverPath';
  }

  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  /// Upload (request body) timeout — bounds the send phase of multipart posts,
  /// which was previously unbounded. Generous for slow Nepali upstream links.
  static const Duration sendTimeout = Duration(minutes: 3);
}
