import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../api/api_config.dart';
import '../models/models.dart';
import '../theme/app_theme.dart';
import '../utils/localized_helpers.dart';
import '../utils/page_transitions.dart';
import '../../features/ad_detail/ad_detail_screen.dart';
import 'tap_scale.dart';
import 'shimmer_badge.dart';

/// Unified Ad Card Widget
/// Used across Homepage Latest Ads, Search Screen, and Shop Page
class AdCard extends StatelessWidget {
  final AdWithDetails ad;
  final VoidCallback? onTap;

  const AdCard({super.key, required this.ad, this.onTap});

  @override
  Widget build(BuildContext context) {
    final imageUrl = ad.thumbnail != null
        ? ApiConfig.getAdImageUrl(ad.thumbnail)
        : (ad.images.isNotEmpty
              ? ApiConfig.getAdImageUrl(ad.images.first)
              : null);

    final isNew = ad.condition?.toLowerCase() == 'brand new';

    // Explicit date format: "Dec 27, 2025 • 12:06 AM"
    final dateFormat = DateFormat("MMM d, yyyy • h:mm a");
    final formattedDate = dateFormat.format(ad.createdAt);

    return TapScale(
      onTap:
          onTap ??
          () {
            Navigator.push(
              context,
              FadeScaleRoute(
                builder: (_) => AdDetailScreen(adId: ad.id, slug: ad.slug),
              ),
            );
          },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  // Image with Hero animation
                  Hero(
                    tag: 'ad-image-${ad.id}',
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(12),
                      ),
                      child: imageUrl != null
                          ? CachedNetworkImage(
                              imageUrl: imageUrl,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              memCacheWidth: 400,
                              fadeInDuration: const Duration(milliseconds: 200),
                              fadeOutDuration: const Duration(
                                milliseconds: 200,
                              ),
                              placeholder: (context, url) =>
                                  Container(color: Colors.grey[100]),
                              errorWidget: (context, url, error) => Container(
                                color: Colors.grey[100],
                                child: Icon(
                                  LucideIcons.image,
                                  size: 40,
                                  color: Colors.grey[300],
                                ),
                              ),
                            )
                          : Container(
                              color: Colors.grey[100],
                              child: Center(
                                child: Icon(
                                  LucideIcons.image,
                                  size: 40,
                                  color: Colors.grey[300],
                                ),
                              ),
                            ),
                    ),
                  ),

                  // Image Count Badge (Top Left)
                  if (ad.images.isNotEmpty)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              LucideIcons.camera,
                              color: Colors.white,
                              size: 10,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${ad.images.length}',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Featured Badge (Top Right) - Keep existing feature if needed
                  if (ad.isFeatured)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: ShimmerBadge(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.amber,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                LucideIcons.star,
                                color: Colors.white,
                                size: 10,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                'common.featured'.tr(),
                                style: GoogleFonts.inter(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                  // Condition Badge (Bottom Right) - NEW/USED
                  // Floating slightly over the edge in design? No, usually "inside" bottom-right.
                  if (ad.condition != null)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isNew
                              ? const Color(0xFF10B981)
                              : const Color(0xFF3B82F6), // Green or Blue
                          borderRadius: BorderRadius.circular(
                            12,
                          ), // Pill shape from image? Or slight rounded rect. Image looks rounded.
                        ),
                        child: Text(
                          context.locale.languageCode == 'ne'
                              ? (isNew ? 'नयाँ' : 'पुरानो')
                              : ad.condition!.toUpperCase(),
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Info Section
            Padding(
              padding: const EdgeInsets.all(
                10,
              ), // Reduced padding slightly to fit more
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title: Dija test ad
                  Text(
                    ad.title,
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: AppTheme.textDark,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),

                  // Category: Folder icon + Traditional Wear
                  Row(
                    children: [
                      Icon(
                        LucideIcons.folderOpen,
                        size: 14,
                        color: Colors.grey[500],
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          ad.localizedCategoryName(context.locale.languageCode),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 6),

                  // Price: Rs. 4,444 (Green, Bold)
                  Text(
                    formatLocalizedPrice(ad.price, context.locale.languageCode),
                    style: GoogleFonts.inter(
                      color: const Color(0xFF10B981),
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Seller Name + Verification Badge
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          ad.userName ?? 'common.seller'.tr(),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey[800],
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),

                      // Verification badge
                      if (_isBusinessVerified) ...[
                        const SizedBox(width: 4),
                        Image.asset(
                          'assets/images/golden-badge.png',
                          width: 14,
                          height: 14,
                        ),
                      ] else if (_isIndividualVerified) ...[
                        const SizedBox(width: 4),
                        Image.asset(
                          'assets/images/blue-badge.png',
                          width: 14,
                          height: 14,
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 4),

                  // Date: Clock + Dec 27, 2025 • 12:06 AM
                  Row(
                    children: [
                      Icon(
                        LucideIcons.clock,
                        size: 12,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          formattedDate,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: Colors.grey[500],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Check if seller is business verified (gold badge)
  bool get _isBusinessVerified {
    final status = ad.businessVerificationStatus?.toLowerCase();
    return status == 'verified' || status == 'approved';
  }

  /// Check if seller is individual verified (blue badge)
  bool get _isIndividualVerified {
    return ad.individualVerified == true;
  }

  /// Format price with commas (Rs. 1,000,000)
  static String formatPrice(double? price) {
    if (price == null) return 'common.contactForPrice'.tr();
    final formatted = price
        .toStringAsFixed(0)
        .replaceAllMapped(
          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
          (Match m) => '${m[1]},',
        );
    return 'Rs. $formatted';
  }
}
