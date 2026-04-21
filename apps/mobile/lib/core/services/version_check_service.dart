import 'dart:developer' as developer;
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_config.dart';

enum UpdateType { none, softPrompt, forceUpdate }

class UpdateCheckResult {
  final UpdateType type;
  final String storeUrl;
  final String latestVersion;

  const UpdateCheckResult({
    required this.type,
    this.storeUrl = '',
    this.latestVersion = '',
  });

  static const none = UpdateCheckResult(type: UpdateType.none);
}

class VersionCheckService {
  static const _firstSeenPrefix = 'version_first_seen_';

  /// Check if an app update is needed.
  /// Returns [UpdateCheckResult] with the update type and store URL.
  static Future<UpdateCheckResult> checkForUpdate() async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version; // e.g. "1.0.0"

      // Fetch version config from backend (public, no auth)
      final baseUrl = ApiConfig.baseUrl.replaceFirst(RegExp(r'/api$'), '');
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ));
      final response = await dio.get('$baseUrl/api/app/version');

      if (response.statusCode != 200 || response.data?['success'] != true) {
        return UpdateCheckResult.none;
      }

      final data = response.data;
      final latestVersion = data['latestVersion'] as String? ?? '1.0.0';
      final minVersion = data['minVersion'] as String? ?? '1.0.0';
      final gracePeriodDays = data['gracePeriodDays'] as int? ?? 7;
      final storeUrls = data['storeUrls'] as Map<String, dynamic>? ?? {};
      final storeUrl = Platform.isIOS
          ? (storeUrls['ios'] as String? ?? '')
          : (storeUrls['android'] as String? ?? '');

      // Critical update: below minVersion → immediate force
      if (_isVersionBelow(currentVersion, minVersion)) {
        developer.log('Force update: $currentVersion < minVersion $minVersion');
        return UpdateCheckResult(
          type: UpdateType.forceUpdate,
          storeUrl: storeUrl,
          latestVersion: latestVersion,
        );
      }

      // Up to date
      if (!_isVersionBelow(currentVersion, latestVersion)) {
        // Clean up old firstSeen entries
        _cleanUpPrefs(latestVersion);
        return UpdateCheckResult.none;
      }

      // New version available — check grace period
      final prefs = await SharedPreferences.getInstance();
      final key = '$_firstSeenPrefix$latestVersion';
      final firstSeenStr = prefs.getString(key);

      if (firstSeenStr == null) {
        // First time seeing this version — record today
        await prefs.setString(key, DateTime.now().toIso8601String());
        developer.log('Soft update: first seen $latestVersion today');
        return UpdateCheckResult(
          type: UpdateType.softPrompt,
          storeUrl: storeUrl,
          latestVersion: latestVersion,
        );
      }

      final firstSeen = DateTime.tryParse(firstSeenStr);
      if (firstSeen == null) {
        return UpdateCheckResult(
          type: UpdateType.softPrompt,
          storeUrl: storeUrl,
          latestVersion: latestVersion,
        );
      }

      final daysSinceFirstSeen = DateTime.now().difference(firstSeen).inDays;

      if (daysSinceFirstSeen >= gracePeriodDays) {
        developer.log('Force update: grace period expired ($daysSinceFirstSeen days)');
        return UpdateCheckResult(
          type: UpdateType.forceUpdate,
          storeUrl: storeUrl,
          latestVersion: latestVersion,
        );
      }

      final daysLeft = gracePeriodDays - daysSinceFirstSeen;
      developer.log('Soft update: $daysLeft days left in grace period');
      return UpdateCheckResult(
        type: UpdateType.softPrompt,
        storeUrl: storeUrl,
        latestVersion: latestVersion,
      );
    } catch (e) {
      // Fail silently — don't block app if API is unreachable
      developer.log('Version check failed: $e');
      return UpdateCheckResult.none;
    }
  }

  /// Compare semver: returns true if [current] < [target]
  static bool _isVersionBelow(String current, String target) {
    final c = current.split('.').map((s) => int.tryParse(s) ?? 0).toList();
    final t = target.split('.').map((s) => int.tryParse(s) ?? 0).toList();
    // Pad to 3 segments
    while (c.length < 3) { c.add(0); }
    while (t.length < 3) { t.add(0); }

    for (var i = 0; i < 3; i++) {
      if (c[i] < t[i]) return true;
      if (c[i] > t[i]) return false;
    }
    return false; // equal
  }

  /// Remove old firstSeen entries for previous versions
  static Future<void> _cleanUpPrefs(String currentLatest) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith(_firstSeenPrefix));
      for (final key in keys) {
        if (key != '$_firstSeenPrefix$currentLatest') {
          await prefs.remove(key);
        }
      }
    } catch (_) {}
  }
}
