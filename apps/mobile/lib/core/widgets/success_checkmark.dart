import 'package:flutter/material.dart';

/// Animated checkmark that draws itself inside a green circle.
class SuccessCheckmark extends StatefulWidget {
  final double size;
  final Duration duration;

  const SuccessCheckmark({
    super.key,
    this.size = 80,
    this.duration = const Duration(milliseconds: 800),
  });

  @override
  State<SuccessCheckmark> createState() => _SuccessCheckmarkState();
}

class _SuccessCheckmarkState extends State<SuccessCheckmark>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        // Circle scales in during first 40%
        final circleProgress = (_controller.value / 0.4).clamp(0.0, 1.0);
        // Check draws during 40%-100%
        final checkProgress =
            ((_controller.value - 0.4) / 0.6).clamp(0.0, 1.0);

        return Transform.scale(
          scale: Curves.elasticOut.transform(circleProgress),
          child: SizedBox(
            width: widget.size,
            height: widget.size,
            child: CustomPaint(
              painter: _CheckmarkPainter(
                progress: checkProgress,
                circleColor: const Color(0xFF10B981),
                checkColor: Colors.white,
              ),
            ),
          ),
        );
      },
    );
  }
}

class _CheckmarkPainter extends CustomPainter {
  final double progress;
  final Color circleColor;
  final Color checkColor;

  _CheckmarkPainter({
    required this.progress,
    required this.circleColor,
    required this.checkColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Draw circle
    final circlePaint = Paint()..color = circleColor;
    canvas.drawCircle(center, radius, circlePaint);

    if (progress <= 0) return;

    // Draw checkmark
    final checkPaint = Paint()
      ..color = checkColor
      ..strokeWidth = size.width * 0.08
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final path = Path();
    final startX = size.width * 0.27;
    final startY = size.height * 0.52;
    final midX = size.width * 0.43;
    final midY = size.height * 0.66;
    final endX = size.width * 0.73;
    final endY = size.height * 0.37;

    path.moveTo(startX, startY);

    if (progress <= 0.5) {
      // First stroke (down-right)
      final t = progress / 0.5;
      path.lineTo(
        startX + (midX - startX) * t,
        startY + (midY - startY) * t,
      );
    } else {
      // First stroke complete + second stroke (up-right)
      path.lineTo(midX, midY);
      final t = (progress - 0.5) / 0.5;
      path.lineTo(
        midX + (endX - midX) * t,
        midY + (endY - midY) * t,
      );
    }

    canvas.drawPath(path, checkPaint);
  }

  @override
  bool shouldRepaint(_CheckmarkPainter oldDelegate) =>
      progress != oldDelegate.progress;
}

/// Shows a success dialog with animated checkmark.
/// Auto-dismisses after [autoDismiss] duration.
Future<void> showSuccessDialog(
  BuildContext context, {
  required String message,
  Duration autoDismiss = const Duration(milliseconds: 1800),
}) {
  return showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) {
      Future.delayed(autoDismiss, () {
        if (ctx.mounted) Navigator.of(ctx).pop();
      });
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SuccessCheckmark(),
              const SizedBox(height: 20),
              Text(
                message,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    },
  );
}
