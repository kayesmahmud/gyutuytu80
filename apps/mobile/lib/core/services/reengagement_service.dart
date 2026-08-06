import 'dart:convert';
import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';

import 'package:easy_localization/easy_localization.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/localized_helpers.dart';
import 'analytics_service.dart';
import 'notification_service.dart';
import 'recent_ads_service.dart';

/// Title/body/tap-payload for one scheduled notification.
typedef _NotificationContent = ({
  String title,
  String body,
  Map<String, Object?> payload,
});

/// Local re-engagement notifications for users who installed but never signed
/// up. Entirely on-device: scheduled with zonedSchedule when the app goes to
/// background, so nothing needs a backend, an account, or an FCM token.
///
/// Product rules (fixed):
///   * Max 1 notification per 48 h, max 3 ever, stop permanently on sign-up.
///   * Copy never claims an account is needed to contact sellers (it isn't —
///     phone numbers are visible to everyone). The honest asks are saved-search
///     alerts and posting an ad.
///
/// Mirrors the cooldown/cap pattern of ReviewService.
class ReEngagementService {
  // SharedPreferences keys
  static const _disabledKey = 'reengage_disabled';
  static const _firedCountKey = 'reengage_fired_count';
  static const _lastFiredKey = 'reengage_last_fired';
  static const _pendingKey = 'reengage_pending';

  // Tuning knobs — product rules, do not raise without a product decision.
  static const _maxNotificationsEver = 3;
  static const _minHoursBetween = 48;

  /// Delay ladder (product decision 2026-08-05): nudge while the item is
  /// fresh, mid-week reminder, then "we miss you" at one week. Indexed by
  /// how many notifications have already fired.
  static const _delays = [
    Duration(hours: 24),
    Duration(days: 3),
    Duration(days: 7),
  ];

  /// Debug builds compress the ladder to minutes so the flow can be verified
  /// on-device without waiting a day. Release always uses [_delays].
  static List<Duration> get _effectiveDelays => kDebugMode
      ? const [Duration(minutes: 1), Duration(minutes: 2), Duration(minutes: 3)]
      : _delays;

  /// Fixed notification id so exactly one re-engagement notification can be
  /// pending, and it can always be cancelled.
  static const _notificationId = 810001;

  /// Call at launch and on every return to foreground. Settles the previous
  /// pending notification (fired while away → counts toward the caps; still
  /// in the future → cancelled, the user came back on their own), then arms
  /// the next one with a fresh full delay — a rolling "since last use" timer.
  ///
  /// Arming happens HERE, while the app is alive, because HyperOS/Android 16
  /// can freeze the process ~100 ms after backgrounding — a pause-time
  /// zonedSchedule silently dies before the alarm reaches the OS (observed on
  /// the Redmi test device, 2026-08-05).
  /// Reentrancy guard — the startup timer and a lifecycle resume (e.g. the
  /// permission dialog closing) can fire near-simultaneously; arming twice
  /// double-counts analytics.
  static bool _arming = false;

  static Future<void> onAppResumed(String languageCode) async {
    if (_arming) return;
    _arming = true;
    try {
      final prefs = await SharedPreferences.getInstance();
      await _settlePending(prefs);
      if (!await _isEligible(prefs)) return;
      await _scheduleNext(prefs, languageCode);
    } catch (e) {
      developer.log('onAppResumed failed: $e', name: 'ReEngagementService');
    } finally {
      _arming = false;
    }
  }

  /// Background-time safety net: arms only when nothing is already pending
  /// (e.g. permission was granted mid-session, after the resume-time arm
  /// skipped). Never cancels — if the freezer kills this run midway, the
  /// alarm armed at resume must survive.
  static Future<void> onAppBackgrounded(String languageCode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_hasFuturePending(prefs)) return;
      if (!await _isEligible(prefs)) return;
      await _scheduleNext(prefs, languageCode);
    } catch (e) {
      developer.log(
        'onAppBackgrounded failed: $e',
        name: 'ReEngagementService',
      );
    }
  }

  /// Whether a scheduled notification is already waiting to fire.
  static bool _hasFuturePending(SharedPreferences prefs) {
    final raw = prefs.getString(_pendingKey);
    if (raw == null) return false;
    final pending = json.decode(raw) as Map<String, dynamic>;
    final fireAt = DateTime.tryParse(pending['fireAt'] as String? ?? '');
    return fireAt != null && DateTime.now().isBefore(fireAt);
  }

  /// Call on sign-up/login. Cancels anything pending and stops the whole
  /// flow forever — signed-in users get real push notifications instead.
  static Future<void> disablePermanently() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await NotificationService().cancelNotification(_notificationId);
      await prefs.remove(_pendingKey);
      await prefs.setBool(_disabledKey, true);
    } catch (e) {
      developer.log(
        'disablePermanently failed: $e',
        name: 'ReEngagementService',
      );
    }
  }

  /// Resolve the previously scheduled notification, if any: past its fire
  /// time → count it (it was shown while we were away); still in the future →
  /// cancel it. Either way the pending slot is cleared.
  static Future<void> _settlePending(SharedPreferences prefs) async {
    final raw = prefs.getString(_pendingKey);
    if (raw == null) return;
    await prefs.remove(_pendingKey);

    final pending = json.decode(raw) as Map<String, dynamic>;
    final fireAt = DateTime.tryParse(pending['fireAt'] as String? ?? '');
    if (fireAt == null) return;

    if (DateTime.now().isAfter(fireAt)) {
      final count = (prefs.getInt(_firedCountKey) ?? 0) + 1;
      await prefs.setInt(_firedCountKey, count);
      await prefs.setString(_lastFiredKey, fireAt.toIso8601String());
    } else {
      await NotificationService().cancelNotification(_notificationId);
    }
  }

  /// All the product rules in one place, cheapest check first.
  static Future<bool> _isEligible(SharedPreferences prefs) async {
    if (prefs.getBool(_disabledKey) ?? false) return false;

    final fired = prefs.getInt(_firedCountKey) ?? 0;
    if (fired >= _maxNotificationsEver) return false;

    // Debug builds skip the cooldown so the full 3-slot ladder is testable.
    final cooldownHours = kDebugMode ? 0 : _minHoursBetween;
    final lastFired = DateTime.tryParse(prefs.getString(_lastFiredKey) ?? '');
    if (lastFired != null &&
        DateTime.now().difference(lastFired).inHours < cooldownHours) {
      return false;
    }

    // Without OS permission a scheduled notification silently never shows —
    // don't burn one of the 3 slots on it.
    return NotificationService().areNotificationsPermitted();
  }

  /// Build and schedule the next notification from on-device history.
  /// Trigger rule (product decision 2026-08-05, revised same day): EVERY
  /// signed-out user qualifies — browsing history just personalises the copy.
  static Future<void> _scheduleNext(
    SharedPreferences prefs,
    String languageCode,
  ) async {
    final recents = await RecentAdsService.getRecentAds();

    final firedCount = prefs.getInt(_firedCountKey) ?? 0;
    final number = firedCount + 1; // 1-based slot in the mixed ladder
    final delay = _effectiveDelays[firedCount];
    final content = recents.isEmpty
        ? _buildGenericContent(number)
        : _buildContent(number, recents.first, languageCode);

    await NotificationService().scheduleLocalNotification(
      id: _notificationId,
      title: content.title,
      body: content.body,
      after: delay,
      payload: json.encode(content.payload),
    );

    final fireAt = DateTime.now().add(delay);
    await prefs.setString(
      _pendingKey,
      json.encode({'fireAt': fireAt.toIso8601String()}),
    );
    await AnalyticsService.logReengageScheduled(
      notificationNumber: number,
      delayHours: delay.inHours,
    );
    if (kDebugMode) {
      developer.log(
        'Scheduled #$number in $delay: "${content.title}"',
        name: 'ReEngagementService',
      );
    }
  }

  /// Ladder for users with no browsing history at all: saved-search pitch,
  /// then post-an-ad pitch, then "we miss you".
  static _NotificationContent _buildGenericContent(int number) {
    final payload = <String, Object?>{'source': 'reengage', 'n': '$number'};
    switch (number) {
      case 1:
        return (
          title: tr('reengagement.savedSearchTitle'),
          body: tr('reengagement.savedSearchBodyGeneric'),
          payload: payload,
        );
      case 2:
        return (
          title: tr('reengagement.postAdTitle'),
          body: tr('reengagement.postAdBody'),
          payload: payload,
        );
      default:
        return (
          title: tr('reengagement.missYouTitle'),
          body: tr('reengagement.missYouBody'),
          payload: payload,
        );
    }
  }

  /// Mixed ladder (product decision 2026-08-05): recall the viewed item,
  /// then pitch saved-search alerts, then "we miss you" + post-an-ad.
  /// Copy never claims an account is needed to contact sellers.
  static _NotificationContent _buildContent(
    int number,
    RecentAd latest,
    String languageCode,
  ) {
    final payload = <String, Object?>{'source': 'reengage', 'n': '$number'};
    switch (number) {
      case 1:
        return (
          title: tr('reengagement.itemRecallTitle'),
          body: tr(
            'reengagement.itemRecallBody',
            args: [
              latest.title,
              formatLocalizedPrice(latest.price, languageCode),
            ],
          ),
          // Tapping brings them back to the exact ad they browsed.
          payload: {...payload, 'route': '/ad', 'adId': '${latest.adId}'},
        );
      case 2:
        return (
          title: tr('reengagement.savedSearchTitle'),
          body: _savedSearchBody(latest, languageCode),
          payload: payload,
        );
      default:
        return (
          title: tr('reengagement.missYouTitle'),
          body: tr('reengagement.missYouBody'),
          payload: payload,
        );
    }
  }

  /// Category-anchored when we know what they browsed, generic otherwise.
  static String _savedSearchBody(RecentAd latest, String languageCode) {
    final category = languageCode == 'ne'
        ? (latest.categoryNameNe ?? latest.categoryName)
        : latest.categoryName;
    if (category == null || category.isEmpty) {
      return tr('reengagement.savedSearchBodyGeneric');
    }
    return tr('reengagement.savedSearchBody', args: [category]);
  }
}
