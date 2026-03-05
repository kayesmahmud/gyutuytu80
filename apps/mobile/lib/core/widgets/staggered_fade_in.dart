import 'dart:async';
import 'package:flutter/material.dart';

/// Wraps a child with a staggered fade + slide entrance animation.
/// Uses implicit animations — no controllers needed.
class StaggeredFadeIn extends StatefulWidget {
  final int index;
  final Widget child;
  final Duration duration;
  final Duration delayPerItem;
  final Offset beginOffset;

  const StaggeredFadeIn({
    super.key,
    required this.index,
    required this.child,
    this.duration = const Duration(milliseconds: 300),
    this.delayPerItem = const Duration(milliseconds: 80),
    this.beginOffset = const Offset(0, 0.05),
  });

  @override
  State<StaggeredFadeIn> createState() => _StaggeredFadeInState();
}

class _StaggeredFadeInState extends State<StaggeredFadeIn> {
  bool _visible = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    final delay = widget.delayPerItem * widget.index;
    if (delay == Duration.zero) {
      _visible = true;
    } else {
      _timer = Timer(delay, () {
        if (mounted) setState(() => _visible = true);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSlide(
      duration: widget.duration,
      curve: Curves.easeOutCubic,
      offset: _visible ? Offset.zero : widget.beginOffset,
      child: AnimatedOpacity(
        duration: widget.duration,
        curve: Curves.easeOutCubic,
        opacity: _visible ? 1.0 : 0.0,
        child: widget.child,
      ),
    );
  }
}
