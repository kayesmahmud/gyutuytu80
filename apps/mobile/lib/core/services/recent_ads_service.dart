import 'dart:convert';
import 'dart:developer' as developer;

import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';

/// One locally-remembered ad view. `adId` is the numeric `ads.id` — never the
/// slug — so it joins with analytics `item_id` and can deep-link back to
/// `AdDetailScreen(adId: ...)`.
class RecentAd {
  final int adId;
  final String title;
  final double price;
  final String? imageUrl;
  final String? categoryName;
  final String? categoryNameNe;
  final DateTime viewedAt;

  const RecentAd({
    required this.adId,
    required this.title,
    required this.price,
    required this.viewedAt,
    this.imageUrl,
    this.categoryName,
    this.categoryNameNe,
  });

  factory RecentAd.fromMap(Map<String, dynamic> map) => RecentAd(
    adId: map['adId'] as int? ?? 0,
    title: map['title'] as String? ?? '',
    price: (map['price'] as num?)?.toDouble() ?? 0,
    imageUrl: map['imageUrl'] as String?,
    categoryName: map['categoryName'] as String?,
    categoryNameNe: map['categoryNameNe'] as String?,
    viewedAt:
        DateTime.tryParse(map['viewedAt'] as String? ?? '') ??
        DateTime.fromMillisecondsSinceEpoch(0),
  );

  Map<String, dynamic> toMap() => {
    'adId': adId,
    'title': title,
    'price': price,
    'imageUrl': imageUrl,
    'categoryName': categoryName,
    'categoryNameNe': categoryNameNe,
    'viewedAt': viewedAt.toIso8601String(),
  };
}

/// On-device recently-viewed ads. Works for signed-out users (no backend,
/// no schema) — the raw material for local re-engagement notifications.
class RecentAdsService {
  static const _key = 'recent_ads';
  static const _maxItems = 20;

  /// Record a view. Most-recent-first, deduped by adId, capped at [_maxItems].
  static Future<void> recordView(Ad ad) async {
    try {
      final ads = await getRecentAds();
      ads.removeWhere((a) => a.adId == ad.id);
      ads.insert(0, _fromAd(ad));
      if (ads.length > _maxItems) ads.removeRange(_maxItems, ads.length);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _key,
        json.encode(ads.map((a) => a.toMap()).toList()),
      );
    } catch (e) {
      developer.log('recordView failed: $e', name: 'RecentAdsService');
    }
  }

  /// Most-recent-first list of viewed ads. Returns empty on any error.
  static Future<List<RecentAd>> getRecentAds() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_key);
      if (raw == null || raw.isEmpty) return [];

      final decoded = json.decode(raw) as List<dynamic>;
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(RecentAd.fromMap)
          .toList();
    } catch (e) {
      developer.log('getRecentAds failed: $e', name: 'RecentAdsService');
      return [];
    }
  }

  static RecentAd _fromAd(Ad ad) => RecentAd(
    adId: ad.id,
    title: ad.title,
    price: ad.price,
    imageUrl: ad.primaryImage,
    categoryName: ad is AdWithDetails ? ad.categoryName : null,
    categoryNameNe: ad is AdWithDetails ? ad.categoryNameNe : null,
    viewedAt: DateTime.now(),
  );
}
