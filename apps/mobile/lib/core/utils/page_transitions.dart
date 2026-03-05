import 'package:flutter/material.dart';

/// Fade + subtle scale transition for premium navigation feel.
/// Used for key routes: AdCard->Detail, Messages->Chat, etc.
class FadeScaleRoute<T> extends PageRouteBuilder<T> {
  final WidgetBuilder builder;

  FadeScaleRoute({required this.builder})
      : super(
          pageBuilder: (context, _, __) => builder(context),
          transitionsBuilder: (_, animation, __, child) {
            return FadeTransition(
              opacity: animation,
              child: ScaleTransition(
                scale: Tween<double>(begin: 0.95, end: 1.0).animate(
                  CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutCubic,
                  ),
                ),
                child: child,
              ),
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
          reverseTransitionDuration: const Duration(milliseconds: 250),
        );
}
