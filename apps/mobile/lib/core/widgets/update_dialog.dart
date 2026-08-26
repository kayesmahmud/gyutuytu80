import 'dart:io';

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../theme/app_theme.dart';

/// App update dialogs — soft prompt (dismissible) and force update (blocking).
class UpdateDialog {
  static String get _storeName => Platform.isIOS ? 'App Store' : 'Play Store';

  /// Soft prompt: dismissible bottom sheet shown during grace period.
  static void showSoftPrompt(
    BuildContext context, {
    required String storeUrl,
    required String latestVersion,
  }) {
    showModalBottomSheet(
      context: context,
      isDismissible: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                Platform.isIOS
                    ? Icons.apple_rounded
                    : Icons.system_update_rounded,
                size: 36,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Update Available',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'A new version ($latestVersion) is available with improvements and bug fixes.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            // Update button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: storeUrl.isNotEmpty
                    ? () => _openStore(storeUrl)
                    : null,
                icon: Icon(
                  Platform.isIOS
                      ? Icons.apple_rounded
                      : Icons.open_in_new_rounded,
                  size: 18,
                ),
                label: Text(
                  storeUrl.isNotEmpty
                      ? 'Update on $_storeName'
                      : 'Update coming soon',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  disabledForegroundColor: Colors.grey.shade500,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Later button
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(
                'Later',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Force update: full-screen blocking dialog. No dismiss, no back button.
  static void showForceScreen(
    BuildContext context, {
    required String storeUrl,
    required String latestVersion,
  }) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: true,
        barrierDismissible: false,
        pageBuilder: (ctx, _, _) => PopScope(
          canPop: false,
          child: Scaffold(
            body: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Icon
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Icon(
                        Platform.isIOS
                            ? Icons.apple_rounded
                            : Icons.system_update_rounded,
                        size: 52,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 32),
                    const Text(
                      'Update Required',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textDark,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'You need to update to version $latestVersion to continue using Thulo Bazaar.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.grey.shade600,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'This update includes important improvements and fixes.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade400,
                      ),
                    ),
                    const SizedBox(height: 40),
                    // Update button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: storeUrl.isNotEmpty
                            ? () => _openStore(storeUrl)
                            : null,
                        icon: Icon(
                          Platform.isIOS
                              ? Icons.apple_rounded
                              : Icons.open_in_new_rounded,
                          size: 20,
                        ),
                        label: Text(
                          storeUrl.isNotEmpty
                              ? 'Update on $_storeName'
                              : 'Update coming soon',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          disabledBackgroundColor: Colors.grey.shade300,
                          disabledForegroundColor: Colors.grey.shade500,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 0,
                        ),
                      ),
                    ),
                    if (storeUrl.isEmpty) ...[
                      const SizedBox(height: 16),
                      Text(
                        'Please check back later or visit the $_storeName manually.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  static Future<void> _openStore(String url) async {
    if (url.isEmpty) return;
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
