import 'package:flutter/foundation.dart';

/// API Configuration
/// Centralized configuration for API endpoints and URLs
class ApiConfig {
  // Production API URL (used in release builds)
  static const String _productionUrl = 'https://api.thulobazaar.com.np/api';

  // Local development IP — both devices must be on the same WiFi network
  static const String _localIp = '192.168.0.113';

  static String get baseUrl {
    // Check for environment override first
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return envUrl;

    // Use production URL in release mode, local IP in debug mode
    if (kReleaseMode) return _productionUrl;

    return 'http://$_localIp:5000/api';
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
}
