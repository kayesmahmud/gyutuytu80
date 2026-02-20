import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
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
  int _currentImageIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Widget _buildCircleButton({required Widget child, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white.withValues(alpha: 0.9),
        ),
        child: Center(child: child),
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
            child: Icon(Icons.image_outlined,
                size: 60, color: Colors.grey[300])),
      );
    }

    return Stack(
      children: [
        PageView.builder(
          controller: _pageController,
          itemCount: images.length,
          onPageChanged: (idx) => setState(() => _currentImageIndex = idx),
          itemBuilder: (context, index) {
            return CachedNetworkImage(
              imageUrl: images[index],
              fit: BoxFit.cover,
              placeholder: (context, url) =>
                  Container(color: Colors.grey[200]),
              errorWidget: (context, url, err) =>
                  Container(color: Colors.grey[200]),
            );
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
                  icon: const Icon(Icons.chevron_left,
                      size: 20, color: Colors.black),
                  onPressed: () {
                    if (_currentImageIndex > 0) {
                      _pageController.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut);
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
                  icon: const Icon(Icons.chevron_right,
                      size: 20, color: Colors.black),
                  onPressed: () {
                    if (_currentImageIndex < images.length - 1) {
                      _pageController.nextPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut);
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
                  fontWeight: FontWeight.bold),
            ),
          ),
        ),

        // Favorite + Share (bottom-right)
        Positioned(
          bottom: 16,
          right: 16,
          child: Row(
            children: [
              _buildCircleButton(
                child: widget.isFavoriteLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black54),
                      )
                    : Icon(
                        widget.isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: widget.isFavorite ? Colors.red : Colors.black87,
                        size: 20,
                      ),
                onTap: widget.onToggleFavorite,
              ),
              const SizedBox(width: 8),
              _buildCircleButton(
                child: const Icon(Icons.share, color: Colors.black87, size: 20),
                onTap: widget.onShare,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
