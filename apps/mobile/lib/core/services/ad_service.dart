import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:dio/dio.dart';

/// Centralized AdMob configuration and initialization.
///
/// In debug mode: uses Google's official test ad unit IDs.
/// In release mode: fetches ad unit IDs from the backend API (/api/ad-config).
/// Falls back to cached values if the API call fails.
class AdService {
  AdService._();

  static bool _initialized = false;
  static bool _configFetched = false;

  // Cached remote config
  static String _remoteBannerAndroid = '';
  static String _remoteBannerIos = '';

  /// Initialize the Mobile Ads SDK. Call once at app startup.
  static Future<void> initialize() async {
    if (_initialized) return;
    await MobileAds.instance.initialize();
    _initialized = true;
    debugPrint('✅ Google Mobile Ads SDK initialized');
  }

  /// Fetch ad config from backend API.
  /// Caches result in SharedPreferences for offline fallback.
  static Future<void> fetchConfig() async {
    try {
      final dio = Dio();
      final res = await dio.get(
        '${ApiConfig.baseUrl}/ad-config',
        options: Options(receiveTimeout: const Duration(seconds: 10)),
      );

      if (res.statusCode == 200 && res.data != null) {
        final data = res.data;
        final enabled = data['enabled'] == true;
        final mobile = data['mobile'] as Map<String, dynamic>?;

        if (enabled && mobile != null) {
          final android = mobile['android'] as Map<String, dynamic>?;
          final ios = mobile['ios'] as Map<String, dynamic>?;

          _remoteBannerAndroid = android?['bannerUnitId'] as String? ?? '';
          _remoteBannerIos = ios?['bannerUnitId'] as String? ?? '';
          _configFetched = true;

          // Cache for offline use
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('ad_config', jsonEncode({
            'bannerAndroid': _remoteBannerAndroid,
            'bannerIos': _remoteBannerIos,
          }));

          debugPrint('✅ Ad config fetched: android=$_remoteBannerAndroid, ios=$_remoteBannerIos');
        } else {
          debugPrint('⚠️ Google Ads disabled via admin panel');
        }
      }
    } catch (e) {
      debugPrint('⚠️ Ad config fetch failed: $e');
      // Try loading from cache
      await _loadCachedConfig();
    }
  }

  static Future<void> _loadCachedConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('ad_config');
      if (cached != null) {
        final data = jsonDecode(cached) as Map<String, dynamic>;
        _remoteBannerAndroid = data['bannerAndroid'] as String? ?? '';
        _remoteBannerIos = data['bannerIos'] as String? ?? '';
        _configFetched = _remoteBannerAndroid.isNotEmpty || _remoteBannerIos.isNotEmpty;
        debugPrint('✅ Ad config loaded from cache');
      }
    } catch (e) {
      debugPrint('⚠️ Failed to load cached ad config: $e');
    }
  }

  // ── Test Ad Unit IDs (Google official) ──────────────────────────────
  static const _testBannerAndroid = 'ca-app-pub-3940256099942544/9214589741';
  static const _testBannerIos = 'ca-app-pub-3940256099942544/2435281174';

  /// Get the banner ad unit ID for the current platform.
  /// Debug mode → test IDs. Release mode → remote config from admin panel.
  static String get _bannerUnitId {
    if (kDebugMode) {
      return Platform.isAndroid ? _testBannerAndroid : _testBannerIos;
    }
    if (_configFetched) {
      final id = Platform.isAndroid ? _remoteBannerAndroid : _remoteBannerIos;
      if (id.isNotEmpty) return id;
    }
    // Fallback to test IDs if no remote config
    return Platform.isAndroid ? _testBannerAndroid : _testBannerIos;
  }

  /// Banner ad between Latest Ads and Featured Ads sections.
  static String get homeBannerTopId => _bannerUnitId;

  /// Banner ad below Featured Ads section.
  static String get homeBannerBottomId => _bannerUnitId;

  /// Banner ad on the ad detail screen.
  static String get adDetailBannerId => _bannerUnitId;
}
