import 'dart:developer' as developer;

import 'package:in_app_review/in_app_review.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Requests an in-app store review at appropriate "positive moments"
/// (e.g. right after a user successfully posts an ad).
///
/// Uses Google's In-App Review API (Android) / SKStoreReviewController (iOS)
/// via the `in_app_review` package. Important constraints:
///   * The OS shows a native rating card *inside* the app — no store redirect.
///   * The OS rate-limits how often the card actually appears; calling
///     [requestReview] does NOT guarantee a card is shown.
///   * Never trigger from a button or after asking "do you like the app?" —
///     that violates store policy. Trigger silently after a good moment.
class ReviewService {
  // SharedPreferences keys
  static const _firstLaunchKey = 'review_first_launch';
  static const _significantActionsKey = 'review_significant_actions';
  static const _lastPromptKey = 'review_last_prompt';
  static const _promptCountKey = 'review_prompt_count';

  // Tuning knobs — adjust to taste.
  static const _minDaysSinceInstall = 3;
  static const _minSignificantActions = 2;
  static const _minDaysBetweenPrompts = 60;
  static const _maxPromptsEver = 3;

  static final InAppReview _inAppReview = InAppReview.instance;

  /// Record that the user just did something positive (e.g. posted an ad).
  /// Call this at every meaningful success point.
  static Future<void> recordSignificantAction() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Stamp the very first launch so we can measure "days since install".
      if (prefs.getString(_firstLaunchKey) == null) {
        await prefs.setString(_firstLaunchKey, DateTime.now().toIso8601String());
      }
      final count = (prefs.getInt(_significantActionsKey) ?? 0) + 1;
      await prefs.setInt(_significantActionsKey, count);
      developer.log('Significant action recorded (total: $count)',
          name: 'ReviewService');
    } catch (e) {
      developer.log('recordSignificantAction failed: $e', name: 'ReviewService');
    }
  }

  /// Ask the OS to show the review card, but only if [_isEligible] passes.
  /// Safe to call from any success handler — fails silently.
  static Future<void> maybeRequestReview() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      if (!await _isEligible(prefs)) return;
      if (!await _inAppReview.isAvailable()) {
        developer.log('In-app review not available on this device',
            name: 'ReviewService');
        return;
      }

      await _inAppReview.requestReview();

      // Record that we asked, so the cooldown / cap logic works next time.
      await prefs.setString(_lastPromptKey, DateTime.now().toIso8601String());
      final promptCount = (prefs.getInt(_promptCountKey) ?? 0) + 1;
      await prefs.setInt(_promptCountKey, promptCount);
      developer.log('Review requested (prompt #$promptCount)',
          name: 'ReviewService');
    } catch (e) {
      developer.log('maybeRequestReview failed: $e', name: 'ReviewService');
    }
  }

  /// Decide whether the user is eligible to be shown the review card right now.
  ///
  /// TODO(you): implement the eligibility rules. See the keys & knobs above.
  /// Available data from [prefs]:
  ///   * getString(_firstLaunchKey)      → ISO date of first significant action
  ///   * getInt(_significantActionsKey)  → how many good moments so far
  ///   * getString(_lastPromptKey)       → ISO date we last asked (null = never)
  ///   * getInt(_promptCountKey)         → how many times we've ever asked
  /// Return true only when ALL your conditions are satisfied.
  static Future<bool> _isEligible(SharedPreferences prefs) async {
    // 1. Lifetime cap (cheapest check first — bail before parsing dates).
    final promptCount = prefs.getInt(_promptCountKey) ?? 0;
    if (promptCount >= _maxPromptsEver) return false;

    // 2. Enough positive moments.
    final actions = prefs.getInt(_significantActionsKey) ?? 0;
    if (actions < _minSignificantActions) return false;

    // 3. Enough time since install. No first-launch stamp yet → not eligible.
    final firstLaunchStr = prefs.getString(_firstLaunchKey);
    final firstLaunch = DateTime.tryParse(firstLaunchStr ?? '');
    if (firstLaunch == null) return false;
    if (DateTime.now().difference(firstLaunch).inDays < _minDaysSinceInstall) {
      return false;
    }

    // 4. Cooldown since the last time we asked (skip if never asked).
    final lastPromptStr = prefs.getString(_lastPromptKey);
    final lastPrompt = DateTime.tryParse(lastPromptStr ?? '');
    if (lastPrompt != null &&
        DateTime.now().difference(lastPrompt).inDays < _minDaysBetweenPrompts) {
      return false;
    }

    return true;
  }
}
