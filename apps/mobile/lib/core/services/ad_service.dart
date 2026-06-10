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
/// Ads only show when the Super Admin has enabled them via the admin panel.
class AdService {
  AdService._();

  /// 🔴 MASTER ADS KILL SWITCH.
  ///
  /// While `false`, NO ad is loaded, requested, or shown anywhere — in debug
  /// OR release, regardless of the Super Admin panel / remote config. The whole
  /// AdMob integration (SDK init, unit IDs, config fetch, banner/interstitial
  /// code) stays intact, so ads can be turned back on later by flipping this to
  /// `true` and shipping a new build.
  static const bool _adsMasterEnabled = false;

  static bool _initialized = false;
  static bool _configFetched = false;
  static bool _adsEnabled = false;

  // Cached remote config — banner
  static String _remoteBannerAndroid = '';
  static String _remoteBannerIos = '';

  // Cached remote config — interstitial
  static String _remoteInterstitialAndroid = '';
  static String _remoteInterstitialIos = '';
  static int _interstitialInterval = 5;

  /// Whether ads are enabled via the admin panel.
  /// In debug mode, always returns true (shows placeholder ads).
  /// In release mode, only returns true when the API confirms ads are enabled.
  static bool get adsEnabled =>
      _adsMasterEnabled && (kDebugMode || _adsEnabled);

  /// How many ad detail views between interstitial ads (from admin panel).
  static int get interstitialInterval => _interstitialInterval;

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
          _remoteInterstitialAndroid = android?['interstitialUnitId'] as String? ?? '';
          _remoteInterstitialIos = ios?['interstitialUnitId'] as String? ?? '';
          _interstitialInterval = (mobile['interstitialInterval'] as int?) ?? 5;
          _configFetched = true;
          _adsEnabled = true;

          // Cache for offline use
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('ad_config', jsonEncode({
            'enabled': true,
            'bannerAndroid': _remoteBannerAndroid,
            'bannerIos': _remoteBannerIos,
            'interstitialAndroid': _remoteInterstitialAndroid,
            'interstitialIos': _remoteInterstitialIos,
            'interstitialInterval': _interstitialInterval,
          }));

          debugPrint('✅ Ad config fetched: banner=$_remoteBannerAndroid, interstitial=$_remoteInterstitialAndroid');
        } else {
          // Admin has disabled ads — clear any cached IDs
          _adsEnabled = false;
          _remoteBannerAndroid = '';
          _remoteBannerIos = '';
          _remoteInterstitialAndroid = '';
          _remoteInterstitialIos = '';
          _configFetched = false;

          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('ad_config', jsonEncode({'enabled': false}));

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
        final enabled = data['enabled'] as bool? ?? false;

        if (enabled) {
          _remoteBannerAndroid = data['bannerAndroid'] as String? ?? '';
          _remoteBannerIos = data['bannerIos'] as String? ?? '';
          _remoteInterstitialAndroid = data['interstitialAndroid'] as String? ?? '';
          _remoteInterstitialIos = data['interstitialIos'] as String? ?? '';
          _interstitialInterval = data['interstitialInterval'] as int? ?? 5;
          _configFetched = _remoteBannerAndroid.isNotEmpty || _remoteBannerIos.isNotEmpty;
          _adsEnabled = _configFetched;
          debugPrint('✅ Ad config loaded from cache (enabled)');
        } else {
          _adsEnabled = false;
          debugPrint('✅ Ad config loaded from cache (disabled)');
        }
      }
    } catch (e) {
      debugPrint('⚠️ Failed to load cached ad config: $e');
    }
  }

  // ── Test Ad Unit IDs (Google official) ──────────────────────────────
  static const _testBannerAndroid = 'ca-app-pub-3940256099942544/9214589741';
  static const _testBannerIos = 'ca-app-pub-3940256099942544/2435281174';
  static const _testInterstitialAndroid = 'ca-app-pub-3940256099942544/1033173712';
  static const _testInterstitialIos = 'ca-app-pub-3940256099942544/4411468910';

  /// Get the banner ad unit ID for the current platform.
  static String get _bannerUnitId {
    if (!_adsMasterEnabled) return '';
    if (kDebugMode) {
      return Platform.isAndroid ? _testBannerAndroid : _testBannerIos;
    }
    if (!_adsEnabled) return '';
    if (_configFetched) {
      final id = Platform.isAndroid ? _remoteBannerAndroid : _remoteBannerIos;
      if (id.isNotEmpty) return id;
    }
    return '';
  }

  /// Get the interstitial ad unit ID for the current platform.
  static String get interstitialUnitId {
    if (!_adsMasterEnabled) return '';
    if (kDebugMode) {
      return Platform.isAndroid ? _testInterstitialAndroid : _testInterstitialIos;
    }
    if (!_adsEnabled) return '';
    if (_configFetched) {
      final id = Platform.isAndroid ? _remoteInterstitialAndroid : _remoteInterstitialIos;
      if (id.isNotEmpty) return id;
    }
    return '';
  }

  /// Banner ad between Latest Ads and Featured Ads sections.
  static String get homeBannerTopId => _bannerUnitId;

  /// Banner ad below Featured Ads section.
  static String get homeBannerBottomId => _bannerUnitId;

  /// Banner ad on the ad detail screen.
  static String get adDetailBannerId => _bannerUnitId;
}
