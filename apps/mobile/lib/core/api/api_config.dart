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

    // For Android emulator, use 10.0.2.2 (maps to host's localhost)
    // For physical devices on same network, use the actual IP
    // Toggle this based on your testing setup:
    const useEmulator = false; // Set to false for physical device testing
 
    if (useEmulator) {
      return 'http://10.0.2.2:5000/api'; // Android emulator → host localhost
    } else {
      return 'http://192.168.1.153:5000/api'; // Physical device on same WiFi
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

  // Timeout settings
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
