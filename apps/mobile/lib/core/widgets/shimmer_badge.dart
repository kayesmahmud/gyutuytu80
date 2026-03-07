import 'package:flutter/material.dart';

/// Wraps a child with a sweeping shimmer highlight effect.
/// A light gradient slides left-to-right on repeat.
class ShimmerBadge extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final Duration pauseDuration;

  const ShimmerBadge({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 1500),
    this.pauseDuration = const Duration(milliseconds: 3000),
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
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _runLoop();
  }

  Future<void> _runLoop() async {
    while (mounted) {
      await _controller.forward(from: 0);
      if (!mounted) return;
      await Future.delayed(widget.pauseDuration);
    }
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
          return ShaderMask(
            shaderCallback: (bounds) {
              final dx = _controller.value * 2 - 0.5;
              return LinearGradient(
                begin: Alignment(dx - 0.3, 0),
                end: Alignment(dx + 0.3, 0),
                colors: const [
                  Colors.white,
                  Color(0x66FFFFFF),
                  Colors.white,
                ],
                stops: const [0.0, 0.5, 1.0],
              ).createShader(bounds);
            },
            blendMode: BlendMode.srcATop,
            child: child,
          );
        },
        child: widget.child,
      ),
    );
  }
}
