import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

/// A reusable inline adaptive banner ad widget.
///
/// Automatically sizes to the available width.
/// In debug mode: shows a colorful placeholder banner while loading or on failure.
/// In release mode: collapses to zero height if the ad fails to load.
class AdBannerWidget extends StatefulWidget {
  final String adUnitId;
  final EdgeInsets padding;

  const AdBannerWidget({
    super.key,
    required this.adUnitId,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
  });

  @override
  State<AdBannerWidget> createState() => _AdBannerWidgetState();
}

class _AdBannerWidgetState extends State<AdBannerWidget> {
  BannerAd? _bannerAd;
  bool _isLoaded = false;
  bool _adFailed = false;
  double _adHeight = 0;

  // Pick a random placeholder once per widget instance
  late final int _placeholderIndex;

  @override
  void initState() {
    super.initState();
    _placeholderIndex = Random().nextInt(_placeholderAds.length);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_bannerAd == null && !_adFailed) {
      _loadAd();
    }
  }

  void _loadAd() {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final adWidth = (screenWidth - widget.padding.horizontal).truncate();

    final adSize = AdSize.getCurrentOrientationInlineAdaptiveBannerAdSize(adWidth);

    _bannerAd = BannerAd(
      adUnitId: widget.adUnitId,
      size: adSize,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) async {
          final bannerAd = ad as BannerAd;
          final platformSize = await bannerAd.getPlatformAdSize();
          if (!mounted) return;
          setState(() {
            _bannerAd = bannerAd;
            _isLoaded = true;
            _adHeight = platformSize?.height.toDouble() ?? adSize.height.toDouble();
          });
        },
        onAdFailedToLoad: (ad, error) {
          debugPrint('Ad failed to load: ${error.message}');
          ad.dispose();
          if (!mounted) return;
          setState(() {
            _bannerAd = null;
            _isLoaded = false;
            _adFailed = true;
          });
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Real ad loaded — show it
    if (_isLoaded && _bannerAd != null) {
      return Padding(
        padding: widget.padding,
        child: SizedBox(
          width: double.infinity,
          height: _adHeight,
          child: AdWidget(ad: _bannerAd!),
        ),
      );
    }

    // Debug mode — show placeholder while loading or on failure
    if (kDebugMode) {
      return Padding(
        padding: widget.padding,
        child: _buildPlaceholder(),
      );
    }

    // Release mode — collapse
    return const SizedBox.shrink();
  }

  Widget _buildPlaceholder() {
    final ad = _placeholderAds[_placeholderIndex];

    return Container(
      width: double.infinity,
      height: 60,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        gradient: LinearGradient(
          colors: ad.colors,
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
      ),
      child: Stack(
        children: [
          // Decorative circle
          Positioned(
            right: -10,
            top: -10,
            child: Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Text(ad.emoji, style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        ad.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        ad.subtitle,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                // "Ad" badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Ad',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Placeholder ad data ──────────────────────────────────────────────────────

class _PlaceholderAd {
  final String emoji;
  final String title;
  final String subtitle;
  final List<Color> colors;

  const _PlaceholderAd({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.colors,
  });
}

const _placeholderAds = [
  _PlaceholderAd(
    emoji: '🔥',
    title: 'Flash Sale',
    subtitle: 'Up to 50% off — Limited time!',
    colors: [Color(0xFFEA580C), Color(0xFFDC2626)],
  ),
  _PlaceholderAd(
    emoji: '🎁',
    title: 'Special Offer',
    subtitle: 'Exclusive deals just for you',
    colors: [Color(0xFF2563EB), Color(0xFF4338CA)],
  ),
  _PlaceholderAd(
    emoji: '🏪',
    title: 'Sell Your Items',
    subtitle: 'List for free — Reach thousands',
    colors: [Color(0xFF059669), Color(0xFF0D9488)],
  ),
  _PlaceholderAd(
    emoji: '✨',
    title: 'New Arrivals',
    subtitle: 'Fresh finds added daily',
    colors: [Color(0xFF9333EA), Color(0xFFEC4899)],
  ),
];
