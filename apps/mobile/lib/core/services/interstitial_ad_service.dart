import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'ad_service.dart';

/// Manages interstitial (full-screen) ads with frequency capping.
///
/// Shows an interstitial ad during the transition from ad card → ad detail,
/// but only every N navigations to avoid annoying users.
///
/// Pattern: show on 1st view, skip next (N-1), show again, repeat.
/// The interval N is configurable from the Super Admin panel.
///
/// Usage:
/// ```dart
/// // Before navigating to ad detail:
/// await InterstitialAdService.maybeShowAd();
/// Navigator.push(...);
/// ```
class InterstitialAdService {
  InterstitialAdService._();

  static InterstitialAd? _interstitialAd;
  static bool _isAdLoaded = false;
  static int _navigationCount = 0;

  /// Preload an interstitial ad so it's ready when needed.
  /// Call once at startup or after showing an ad.
  static void preload() {
    final unitId = AdService.interstitialUnitId;
    if (unitId.isEmpty) return;

    InterstitialAd.load(
      adUnitId: unitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isAdLoaded = true;
          debugPrint('✅ Interstitial ad preloaded');
        },
        onAdFailedToLoad: (error) {
          _isAdLoaded = false;
          debugPrint('⚠️ Interstitial ad failed to load: ${error.message}');
        },
      ),
    );
  }

  /// Call this before navigating to ad detail screen.
  /// Returns true if an interstitial was shown (caller should wait for it).
  static Future<bool> maybeShowAd() async {
    if (!AdService.adsEnabled) return false;

    _navigationCount++;
    final interval = AdService.interstitialInterval;

    // Show on 1st view, then every N views
    // e.g., interval=5: show on views 1, 6, 11, 16...
    final shouldShow =
        _navigationCount == 1 || (_navigationCount - 1) % interval == 0;

    if (!shouldShow) {
      debugPrint(
        '📊 Interstitial skipped (view $_navigationCount, interval=$interval)',
      );
      return false;
    }

    if (!_isAdLoaded || _interstitialAd == null) {
      debugPrint('⚠️ Interstitial not ready, preloading for next time');
      preload();
      return false;
    }

    debugPrint('📺 Showing interstitial ad (view $_navigationCount)');

    // Set up callbacks before showing
    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _interstitialAd = null;
        _isAdLoaded = false;
        // Preload the next one immediately
        preload();
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        debugPrint('⚠️ Interstitial failed to show: ${error.message}');
        ad.dispose();
        _interstitialAd = null;
        _isAdLoaded = false;
        preload();
      },
    );

    await _interstitialAd!.show();
    return true;
  }

  /// Dispose any loaded ad (call when cleaning up).
  static void dispose() {
    _interstitialAd?.dispose();
    _interstitialAd = null;
    _isAdLoaded = false;
  }
}
