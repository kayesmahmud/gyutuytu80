import 'dart:developer' as developer;

import 'package:firebase_analytics/firebase_analytics.dart';

import '../models/ad.dart';

/// App-side conversion tracking, mirroring the web analytics layer
/// (`apps/web/src/lib/analytics/index.ts`).
///
/// Why this exists: Google Ads App campaigns can only optimise toward events
/// they can see. Until now the app logged nothing, so the only signal available
/// was "install" — which is exactly why ~10k installs produced ~1k
/// registrations. Google was buying the cheapest installs because cheap
/// installs were the only thing it was asked for.
///
/// CRITICAL — `itemId` is the numeric `ads.id`, never the slug. It is the join
/// key across the web pixel (`content_ids`), the dataLayer (`ecomm_prodid`) and
/// the product feeds. Matching IDs are what let ONE catalog retarget a user who
/// browsed on the app and later opens Facebook on the web.
///
/// Event names follow GA4 conventions so Firebase → Google Ads conversion
/// import works without remapping. `post_ad` is custom (no GA4 event describes
/// listing an item for sale) and must be marked as a conversion in the
/// Firebase console before Ads can optimise toward it.
///
/// TODO(Meta App Events): the Meta equivalent needs the `facebook_app_events`
/// package plus native config that does not exist yet — a Meta App ID and
/// Client Token in `ios/Runner/Info.plist` and
/// `android/app/src/main/res/values/strings.xml`. The SDK crashes on launch if
/// those are missing, so it is deliberately not wired up. Create a Meta App in
/// the same Business Portfolio as pixel 988432024000859, then add a Meta
/// transport alongside each `_log` call below.
class AnalyticsService {
  static FirebaseAnalytics? _analytics;

  /// Safe to call before Firebase.initializeApp completes — every log is a
  /// no-op until this runs, rather than throwing.
  static void initialize() {
    try {
      _analytics = FirebaseAnalytics.instance;
    } catch (e) {
      developer.log('⚠️ Analytics init failed: $e', name: 'AnalyticsService');
    }
  }

  /// Analytics must never break a user flow, so all failures are swallowed.
  static Future<void> _log(String name, Map<String, Object> parameters) async {
    final analytics = _analytics;
    if (analytics == null) return;

    try {
      await analytics.logEvent(name: name, parameters: parameters);
    } catch (e) {
      developer.log('⚠️ $name failed: $e', name: 'AnalyticsService');
    }
  }

  /// A user opened an ad detail page. Feeds dynamic remarketing audiences.
  static Future<void> logViewItem(Ad ad) => _log('view_item', {
    'item_id': ad.id.toString(),
    'item_name': ad.title,
    'item_category': ad.categoryId.toString(),
    'price': ad.price,
    'currency': 'NPR',
  });

  /// A user searched or filtered listings.
  static Future<void> logSearch(String searchTerm) {
    final term = searchTerm.trim();
    if (term.isEmpty) return Future.value();
    return _log('search', {'search_term': term});
  }

  /// A user contacted a seller by phone or message.
  ///
  /// This is the buyer-side conversion: a classifieds marketplace has no
  /// checkout, so seller contact is as far as the funnel goes on-platform.
  static Future<void> logGenerateLead({
    required int adId,
    required String method,
  }) => _log('generate_lead', {
    'ad_id': adId.toString(),
    'contact_method': method,
    'currency': 'NPR',
  });

  /// A new user finished registering. The event that closes the 10k→1k gap:
  /// once Ads can see this, App campaigns can optimise for registrations
  /// rather than raw installs.
  static Future<void> logSignUp(String method) =>
      _log('sign_up', {'method': method});

  /// A seller successfully posted an ad. Primary supply-side goal.
  static Future<void> logPostAd({
    required int adId,
    required String title,
    double? price,
  }) => _log('post_ad', {
    'ad_id': adId.toString(),
    'ad_title': title,
    if (price != null) 'value': price,
    'currency': 'NPR',
  });

  /// A user opened a listing from a dynamic remarketing deep link. Lets you
  /// prove retargeting actually returns people to the item they browsed.
  static Future<void> logDeepLinkOpen(String slug) =>
      _log('deep_link_open', {'ad_slug': slug});

  /// A local re-engagement notification was scheduled for a signed-out user.
  /// Compare against [logReengageTapped] to measure whether the copy works.
  static Future<void> logReengageScheduled({
    required int notificationNumber,
    required int delayHours,
  }) => _log('reengage_scheduled', {
    'notification_number': notificationNumber.toString(),
    'delay_hours': delayHours.toString(),
  });

  /// The user came back by tapping a re-engagement notification — the only
  /// signal that the whole local-notification loop actually re-engages.
  static Future<void> logReengageTapped(String notificationNumber) =>
      _log('reengage_tapped', {'notification_number': notificationNumber});
}
