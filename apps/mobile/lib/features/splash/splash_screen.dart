import 'package:flutter/material.dart';

import '../../main.dart' show appReadyForDeepLinks, processPendingNotification;

class SplashScreen extends StatefulWidget {
  final Widget nextScreen;

  const SplashScreen({super.key, required this.nextScreen});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  // Logo: scale from 1.8 → 1.0 (zoom out)
  late final Animation<double> _logoScale;

  // Fade-out at the end
  late final Animation<double> _fadeOut;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    // Zoom out: big → normal (0% – 70%)
    _logoScale = Tween<double>(begin: 1.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.7, curve: Curves.easeOutCubic),
      ),
    );

    // Fade out (80% – 100%)
    _fadeOut = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.8, 1.0, curve: Curves.easeIn),
      ),
    );

    _controller.forward();
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                widget.nextScreen,
            transitionDuration: Duration.zero,
          ),
        );

        // The base route is now nextScreen (MainNav) — safe to replay any deep
        // link that launched the app from a push (cold start). Without this gate
        // the screen we push gets clobbered by the pushReplacement above.
        appReadyForDeepLinks = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          processPendingNotification();
        });
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFDC143C),
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Opacity(
            opacity: _fadeOut.value,
            child: Center(
              child: Transform.scale(
                scale: _logoScale.value,
                child: Image.asset(
                  'assets/images/logo_white_padded.png',
                  width: 150,
                  height: 150,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
