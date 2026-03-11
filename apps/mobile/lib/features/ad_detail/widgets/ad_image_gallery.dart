import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:like_button/like_button.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';

class AdImageGallery extends StatefulWidget {
  final AdWithDetails ad;
  final bool isFavorite;
  final bool isFavoriteLoading;
  final VoidCallback? onToggleFavorite;
  final VoidCallback? onShare;

  const AdImageGallery({
    super.key,
    required this.ad,
    this.isFavorite = false,
    this.isFavoriteLoading = false,
    this.onToggleFavorite,
    this.onShare,
  });

  @override
  State<AdImageGallery> createState() => _AdImageGalleryState();
}

class _AdImageGalleryState extends State<AdImageGallery> {
  final PageController _pageController = PageController();
  final TransformationController _transformController =
      TransformationController();
  int _currentImageIndex = 0;
  bool _isZoomed = false;

  @override
  void dispose() {
    _pageController.dispose();
    _transformController.dispose();
    super.dispose();
  }

  Widget? get _promotionBadge {
    final ad = widget.ad;
    final now = DateTime.now();
    bool isActive(bool flag, DateTime? until) =>
        flag && (until == null || now.isBefore(until));

    String label;
    IconData icon;
    List<Color> colors;
    Color textColor;

    if (isActive(ad.isUrgent, ad.urgentUntil)) {
      label = 'URGENT';
      icon = LucideIcons.zap;
      colors = [const Color(0xFFEF4444), const Color(0xFFDC2626)];
      textColor = Colors.white;
    } else if (isActive(ad.isFeatured, ad.featuredUntil)) {
      label = 'FEATURED';
      icon = LucideIcons.star;
      colors = [const Color(0xFFF59E0B), const Color(0xFFF97316)];
      textColor = Colors.black;
    } else if (isActive(ad.isSticky, ad.stickyUntil)) {
      label = 'STICKY';
      icon = LucideIcons.pin;
      colors = [const Color(0xFF3B82F6), const Color(0xFF2563EB)];
      textColor = Colors.white;
    } else {
      return null;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors),
        borderRadius: BorderRadius.circular(6),
        boxShadow: [
          BoxShadow(
            color: colors.first.withValues(alpha: 0.4),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: textColor, size: 14),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: textColor,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleButton({required Widget child, VoidCallback? onTap}) {
    return Material(
      color: Colors.white.withValues(alpha: 0.9),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 36,
          height: 36,
          child: Center(child: child),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.ad.images.isNotEmpty
        ? widget.ad.images.map((img) => ApiConfig.getAdImageUrl(img)).toList()
        : <String>[];

    if (images.isEmpty) {
      return Container(
        color: Colors.grey[100],
        child: Center(
          child: Icon(LucideIcons.image, size: 60, color: Colors.grey[300]),
        ),
      );
    }

    return Stack(
      children: [
        PageView.builder(
          controller: _pageController,
          itemCount: images.length,
          physics: _isZoomed
              ? const NeverScrollableScrollPhysics()
              : const AlwaysScrollableScrollPhysics(),
          onPageChanged: (idx) {
            _transformController.value = Matrix4.identity();
            setState(() {
              _currentImageIndex = idx;
              _isZoomed = false;
            });
          },
          itemBuilder: (context, index) {
            final image = CachedNetworkImage(
              imageUrl: images[index],
              fit: BoxFit.cover,
              memCacheWidth: 800,
              fadeInDuration: const Duration(milliseconds: 200),
              fadeOutDuration: const Duration(milliseconds: 200),
              placeholder: (context, url) => Container(color: Colors.grey[200]),
              errorWidget: (context, url, err) =>
                  Container(color: Colors.grey[200]),
            );
            final zoomable = InteractiveViewer(
              transformationController: _transformController,
              minScale: 1.0,
              maxScale: 3.0,
              onInteractionEnd: (_) {
                final scale = _transformController.value.getMaxScaleOnAxis();
                final zoomed = scale > 1.05;
                if (zoomed != _isZoomed) setState(() => _isZoomed = zoomed);
              },
              child: image,
            );
            // Hero only on first image for card→detail transition
            if (index == 0) {
              return Hero(tag: 'ad-image-${widget.ad.id}', child: zoomable);
            }
            return zoomable;
          },
        ),

        // Arrows
        if (images.length > 1) ...[
          Positioned(
            left: 8,
            top: 0,
            bottom: 0,
            child: Center(
              child: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.8),
                radius: 16,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(
                    LucideIcons.chevronLeft,
                    size: 20,
                    color: Colors.black,
                  ),
                  onPressed: () {
                    if (_currentImageIndex > 0) {
                      _pageController.previousPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    }
                  },
                ),
              ),
            ),
          ),
          Positioned(
            right: 8,
            top: 0,
            bottom: 0,
            child: Center(
              child: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.8),
                radius: 16,
                child: IconButton(
                  padding: EdgeInsets.zero,
                  icon: const Icon(
                    LucideIcons.chevronRight,
                    size: 20,
                    color: Colors.black,
                  ),
                  onPressed: () {
                    if (_currentImageIndex < images.length - 1) {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    }
                  },
                ),
              ),
            ),
          ),
        ],

        // Promotion Badge (middle-right)
        if (_promotionBadge != null)
          Positioned(
            top: 0,
            bottom: 0,
            right: 16,
            child: Center(child: _promotionBadge!),
          ),

        // Counter Badge (bottom-left)
        Positioned(
          bottom: 16,
          left: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.7),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              "${_currentImageIndex + 1}/${images.length}",
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),

        // Favorite + Share (bottom-right)
        Positioned(
          bottom: 16,
          right: 16,
          child: Row(
            children: [
              LikeButton(
                size: 36,
                isLiked: widget.isFavorite,
                circleColor: const CircleColor(
                  start: Color(0xFFFF5252),
                  end: Color(0xFFFF1744),
                ),
                bubblesColor: const BubblesColor(
                  dotPrimaryColor: Color(0xFFFF5252),
                  dotSecondaryColor: Color(0xFFFFAB91),
                ),
                likeBuilder: (isLiked) {
                  return Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                    child: Center(
                      child: Icon(
                        isLiked ? Icons.favorite : Icons.favorite_border,
                        color: isLiked ? Colors.red : Colors.black87,
                        size: 20,
                      ),
                    ),
                  );
                },
                onTap: (isLiked) async {
                  widget.onToggleFavorite?.call();
                  return !isLiked;
                },
              ),
              const SizedBox(width: 8),
              _buildCircleButton(
                child: const Icon(
                  LucideIcons.share2,
                  color: Colors.black87,
                  size: 20,
                ),
                onTap: widget.onShare,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
