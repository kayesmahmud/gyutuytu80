import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_avif/flutter_avif.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// A unified image widget that handles both AVIF and JPEG/PNG/WebP formats.
/// Uses flutter_avif for .avif URLs, CachedNetworkImage for everything else.
class AppCachedImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final int? memCacheWidth;
  final Widget? placeholder;
  final Widget? errorWidget;

  const AppCachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.memCacheWidth,
    this.placeholder,
    this.errorWidget,
  });

  static bool _isAvif(String url) =>
      url.toLowerCase().endsWith('.avif');

  Widget _defaultPlaceholder() =>
      Container(color: Colors.grey[100]);

  Widget _defaultError() => Container(
        color: Colors.grey[100],
        child: Icon(LucideIcons.image, size: 40, color: Colors.grey[300]),
      );

  @override
  Widget build(BuildContext context) {
    if (_isAvif(imageUrl)) {
      return AvifImage.network(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (context, error, stackTrace) =>
            errorWidget ?? _defaultError(),
        frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
          if (wasSynchronouslyLoaded || frame != null) return child;
          return placeholder ?? _defaultPlaceholder();
        },
      );
    }

    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      memCacheWidth: memCacheWidth,
      fadeInDuration: const Duration(milliseconds: 200),
      fadeOutDuration: const Duration(milliseconds: 200),
      placeholder: (context, url) => placeholder ?? _defaultPlaceholder(),
      errorWidget: (context, url, error) => errorWidget ?? _defaultError(),
    );
  }
}

/// ImageProvider version for use with CircleAvatar.backgroundImage etc.
/// Falls back to NetworkImage for AVIF since CachedNetworkImageProvider
/// doesn't support AVIF decoding.
ImageProvider appCachedImageProvider(String imageUrl) {
  if (imageUrl.toLowerCase().endsWith('.avif')) {
    return NetworkImage(imageUrl);
  }
  return CachedNetworkImageProvider(imageUrl);
}
