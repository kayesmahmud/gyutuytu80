import 'package:flutter/foundation.dart';

/// API Configuration
/// Centralized configuration for API endpoints and URLs
class ApiConfig {
  // Detect if running on emulator vs physical device
  // Emulator uses 10.0.2.2 to reach host machine's localhost
  // Physical device uses the actual IP address
  static String get baseUrl {
    // Check for environment override first
    const envUrl = String.fromEnvironment('API_URL');
    if (envUrl.isNotEmpty) return envUrl;

    if (kIsWeb) {
      return 'http://localhost:5000/api';
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      // Android Physical Device (via USB):
      // Provides the most stable connection.
      // Run: adb reverse tcp:5000 tcp:5000
      return 'http://127.0.0.1:5000/api'; 
    } else {
      // iOS Simulator / Mac defaults to localhost
      return 'http://localhost:5000/api';
    }
  }

  // Auth endpoints
  static String get authUrl => '$baseUrl/auth';

  // Image/uploads base URL
  static String get uploadsBaseUrl {
    // Remove /api from baseUrl to get uploads path
    final base = baseUrl.replaceAll('/api', '');
    return '$base/uploads';
  }

  // Helper to get full avatar URL
  static String getAvatarUrl(String? avatar) {
    if (avatar == null || avatar.isEmpty) return '';
    if (avatar.startsWith('http')) return avatar;
    // If path already contains /uploads/, just prepend the base URL
    if (avatar.startsWith('/uploads/')) {
      final base = baseUrl.replaceAll('/api', '');
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
      final base = baseUrl.replaceAll('/api', '');
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
      final base = baseUrl.replaceAll('/api', '');
      return '$base$coverPath';
    }
    return '$uploadsBaseUrl/covers/$coverPath';
  }

  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
