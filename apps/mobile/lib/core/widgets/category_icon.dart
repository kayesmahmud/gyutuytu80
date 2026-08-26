import 'package:flutter/material.dart';

/// Custom category icon (single source of truth in assets/category-icons,
/// keyed by category slug), falling back to the emoji if the image is missing.
///
/// Extracted from the home screen so the post-ad picker and any future
/// surface render the same artwork.
class CategoryIcon extends StatelessWidget {
  final String? slug;
  final String emoji;
  final double size;

  const CategoryIcon({
    super.key,
    required this.slug,
    required this.emoji,
    this.size = 46,
  });

  @override
  Widget build(BuildContext context) {
    final currentSlug = slug;
    if (currentSlug == null || currentSlug.isEmpty) {
      return Text(emoji, style: TextStyle(fontSize: size * 0.76));
    }
    // cacheWidth/Height decode the large source PNGs (135-317KB) at 4x the
    // render size instead of full resolution.
    return Image.asset(
      'assets/category-icons/$currentSlug.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
      cacheWidth: (size * 4).round(),
      cacheHeight: (size * 4).round(),
      errorBuilder: (_, _, _) =>
          Text(emoji, style: TextStyle(fontSize: size * 0.76)),
    );
  }
}
