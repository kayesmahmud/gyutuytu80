import 'package:flutter/material.dart';
import '../../core/models/promotion.dart';

/// Promotion Badge - displays promotion status on ad cards
class PromotionBadge extends StatelessWidget {
  final PromotionTypeEnum type;
  final DateTime? expiresAt;
  final PromotionBadgeSize size;

  const PromotionBadge({
    super.key,
    required this.type,
    this.expiresAt,
    this.size = PromotionBadgeSize.small,
  });

  /// Create from Ad promotion flags
  factory PromotionBadge.fromAd({
    bool isFeatured = false,
    bool isUrgent = false,
    bool isSticky = false,
    DateTime? featuredUntil,
    DateTime? urgentUntil,
    DateTime? stickyUntil,
    PromotionBadgeSize size = PromotionBadgeSize.small,
  }) {
    // Priority: Urgent > Featured > Sticky
    if (isUrgent && urgentUntil != null && DateTime.now().isBefore(urgentUntil)) {
      return PromotionBadge(
        type: PromotionTypeEnum.urgent,
        expiresAt: urgentUntil,
        size: size,
      );
    }
    if (isFeatured && featuredUntil != null && DateTime.now().isBefore(featuredUntil)) {
      return PromotionBadge(
        type: PromotionTypeEnum.featured,
        expiresAt: featuredUntil,
        size: size,
      );
    }
    if (isSticky && stickyUntil != null && DateTime.now().isBefore(stickyUntil)) {
      return PromotionBadge(
        type: PromotionTypeEnum.sticky,
        expiresAt: stickyUntil,
        size: size,
      );
    }
    // Return a hidden badge if no promotion is active
    return PromotionBadge(
      type: PromotionTypeEnum.featured,
      expiresAt: null,
      size: size,
    );
  }

  bool get isActive {
    if (expiresAt == null) return false;
    return DateTime.now().isBefore(expiresAt!);
  }

  @override
  Widget build(BuildContext context) {
    if (!isActive) return const SizedBox.shrink();

    return _AnimatedBadge(
      type: type,
      size: size,
    );
  }
}

enum PromotionBadgeSize { small, medium, large }

class _AnimatedBadge extends StatefulWidget {
  final PromotionTypeEnum type;
  final PromotionBadgeSize size;

  const _AnimatedBadge({
    required this.type,
    required this.size,
  });

  @override
  State<_AnimatedBadge> createState() => _AnimatedBadgeState();
}

class _AnimatedBadgeState extends State<_AnimatedBadge>
    with SingleTickerProviderStateMixin {
  AnimationController? _animationController;
  Animation<double>? _scaleAnimation;

  @override
  void initState() {
    super.initState();
    // Only animate urgent badges
    if (widget.type == PromotionTypeEnum.urgent) {
      _animationController = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1500),
      );
      _scaleAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
        CurvedAnimation(
          parent: _animationController!,
          curve: Curves.easeInOut,
        ),
      );
      _animationController!.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _animationController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final badge = Container(
      padding: _getPadding(),
      decoration: BoxDecoration(
        gradient: _getGradient(),
        borderRadius: BorderRadius.circular(_getBorderRadius()),
        boxShadow: [
          BoxShadow(
            color: _getColor().withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            widget.type.emoji,
            style: TextStyle(fontSize: _getEmojiSize()),
          ),
          SizedBox(width: _getSpacing()),
          Text(
            widget.type.displayName.toUpperCase(),
            style: TextStyle(
              fontSize: _getFontSize(),
              fontWeight: FontWeight.bold,
              color: widget.type == PromotionTypeEnum.featured
                  ? Colors.black
                  : Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );

    if (_scaleAnimation != null) {
      return ScaleTransition(
        scale: _scaleAnimation!,
        child: badge,
      );
    }

    return badge;
  }

  EdgeInsets _getPadding() {
    switch (widget.size) {
      case PromotionBadgeSize.small:
        return const EdgeInsets.symmetric(horizontal: 6, vertical: 3);
      case PromotionBadgeSize.medium:
        return const EdgeInsets.symmetric(horizontal: 8, vertical: 4);
      case PromotionBadgeSize.large:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 6);
    }
  }

  double _getBorderRadius() {
    switch (widget.size) {
      case PromotionBadgeSize.small:
        return 4;
      case PromotionBadgeSize.medium:
        return 6;
      case PromotionBadgeSize.large:
        return 8;
    }
  }

  double _getFontSize() {
    switch (widget.size) {
      case PromotionBadgeSize.small:
        return 9;
      case PromotionBadgeSize.medium:
        return 11;
      case PromotionBadgeSize.large:
        return 13;
    }
  }

  double _getEmojiSize() {
    switch (widget.size) {
      case PromotionBadgeSize.small:
        return 10;
      case PromotionBadgeSize.medium:
        return 12;
      case PromotionBadgeSize.large:
        return 14;
    }
  }

  double _getSpacing() {
    switch (widget.size) {
      case PromotionBadgeSize.small:
        return 2;
      case PromotionBadgeSize.medium:
        return 3;
      case PromotionBadgeSize.large:
        return 4;
    }
  }

  LinearGradient _getGradient() {
    switch (widget.type) {
      case PromotionTypeEnum.featured:
        return const LinearGradient(
          colors: [Color(0xFFF59E0B), Color(0xFFF97316)], // Yellow to orange
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case PromotionTypeEnum.urgent:
        return const LinearGradient(
          colors: [Color(0xFFEF4444), Color(0xFFDC2626)], // Red gradient
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
      case PromotionTypeEnum.sticky:
        return const LinearGradient(
          colors: [Color(0xFF3B82F6), Color(0xFF2563EB)], // Blue gradient
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        );
    }
  }

  Color _getColor() {
    switch (widget.type) {
      case PromotionTypeEnum.featured:
        return const Color(0xFFF59E0B);
      case PromotionTypeEnum.urgent:
        return const Color(0xFFEF4444);
      case PromotionTypeEnum.sticky:
        return const Color(0xFF3B82F6);
    }
  }
}

/// Simple inline badge (smaller, for list views)
class PromotionInlineBadge extends StatelessWidget {
  final PromotionTypeEnum type;

  const PromotionInlineBadge({
    super.key,
    required this.type,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: _getColor().withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            type.emoji,
            style: const TextStyle(fontSize: 10),
          ),
          const SizedBox(width: 3),
          Text(
            type.displayName,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: _getColor(),
            ),
          ),
        ],
      ),
    );
  }

  Color _getColor() {
    switch (type) {
      case PromotionTypeEnum.featured:
        return const Color(0xFFF59E0B);
      case PromotionTypeEnum.urgent:
        return const Color(0xFFEF4444);
      case PromotionTypeEnum.sticky:
        return const Color(0xFF3B82F6);
    }
  }
}
