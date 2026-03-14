import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Wraps a child with a traveling border shimmer effect.
/// A bright highlight sweeps around the border while the
/// child content stays fully visible and unaffected.
class ShimmerBadge extends StatefulWidget {
  final Widget child;
  final Color glowColor;
  final Duration duration;

  const ShimmerBadge({
    super.key,
    required this.child,
    this.glowColor = const Color(0xFFF59E0B),
    this.duration = const Duration(milliseconds: 2500),
  });

  @override
  State<ShimmerBadge> createState() => _ShimmerBadgeState();
}

class _ShimmerBadgeState extends State<ShimmerBadge>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return CustomPaint(
            foregroundPainter: _BorderShimmerPainter(
              progress: _controller.value,
              color: widget.glowColor,
              borderRadius: 4,
              strokeWidth: 1.5,
            ),
            child: child,
          );
        },
        child: widget.child,
      ),
    );
  }
}

class _BorderShimmerPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double borderRadius;
  final double strokeWidth;

  _BorderShimmerPainter({
    required this.progress,
    required this.color,
    required this.borderRadius,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(borderRadius));

    // Base border: subtle static border
    final basePaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..color = color.withValues(alpha: 0.3);
    canvas.drawRRect(rrect, basePaint);

    // Animated sweep: a bright arc that travels around the border
    final sweepPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..shader = SweepGradient(
        center: Alignment.center,
        startAngle: 0,
        endAngle: math.pi * 2,
        colors: [
          color.withValues(alpha: 0.0),
          color.withValues(alpha: 0.0),
          Colors.white.withValues(alpha: 0.9),
          color,
          color.withValues(alpha: 0.0),
          color.withValues(alpha: 0.0),
        ],
        stops: const [0.0, 0.35, 0.48, 0.52, 0.65, 1.0],
        transform: GradientRotation(progress * math.pi * 2),
      ).createShader(rect);

    canvas.drawRRect(rrect, sweepPaint);
  }

  @override
  bool shouldRepaint(_BorderShimmerPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
