import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:like_button/like_button.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';
import 'package:mobile/core/widgets/app_cached_image.dart';

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
            final image = AppCachedImage(
              imageUrl: images[index],
              fit: BoxFit.cover,
              memCacheWidth: 800,
              placeholder: Container(color: Colors.grey[200]),
              errorWidget: Container(color: Colors.grey[200]),
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
              Column(
                mainAxisSize: MainAxisSize.min,
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
                  if (widget.ad.favoritesCount > 0)
                    Container(
                      margin: const EdgeInsets.only(top: 2),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${widget.ad.favoritesCount}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.red,
                        ),
                      ),
                    ),
                ],
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
