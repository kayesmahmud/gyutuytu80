import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:mobile/core/api/api_config.dart';
import 'package:mobile/core/models/models.dart';

class AdImageGallery extends StatefulWidget {
  final AdWithDetails ad;

  const AdImageGallery({super.key, required this.ad});

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

        // Promo Banner overlay (Tech Deals) - Example static
        Positioned(
          top: 50, // Below SafeArea/AppBar
          left: 0,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                  colors: [Color(0xFF0EA5E9), Color(0xFF22D3EE)]),
              borderRadius: BorderRadius.horizontal(right: Radius.circular(4)),
            ),
            child: Text(
              "Verified Ad",
              style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold),
            ),
          ),
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

        // Counter Badge
        Positioned(
          bottom: 16,
          right: 16,
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
      ],
    );
  }
}
