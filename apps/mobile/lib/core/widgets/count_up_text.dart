import 'package:flutter/material.dart';

/// Animates an integer from 0 to [value] with a count-up effect.
/// Uses TweenAnimationBuilder — no controller needed, auto-disposes.
class CountUpText extends StatelessWidget {
  final int value;
  final TextStyle? style;
  final Duration duration;
  final String Function(int)? formatter;

  const CountUpText({
    super.key,
    required this.value,
    this.style,
    this.duration = const Duration(milliseconds: 800),
    this.formatter,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<int>(
      tween: IntTween(begin: 0, end: value),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, animatedValue, child) {
        final text = formatter?.call(animatedValue) ?? '$animatedValue';
        return Text(text, style: style);
      },
    );
  }
}
