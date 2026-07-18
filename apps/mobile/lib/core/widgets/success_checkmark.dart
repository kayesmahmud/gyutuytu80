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
        final checkProgress = ((_controller.value - 0.4) / 0.6).clamp(0.0, 1.0);

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
      path.lineTo(startX + (midX - startX) * t, startY + (midY - startY) * t);
    } else {
      // First stroke complete + second stroke (up-right)
      path.lineTo(midX, midY);
      final t = (progress - 0.5) / 0.5;
      path.lineTo(midX + (endX - midX) * t, midY + (endY - midY) * t);
    }

    canvas.drawPath(path, checkPaint);
  }

  @override
  bool shouldRepaint(_CheckmarkPainter oldDelegate) =>
      progress != oldDelegate.progress;
}

/// Shows a success dialog with animated checkmark.
///
/// Without [subtitle], auto-dismisses after [autoDismiss].
/// With [subtitle], stays open until the user taps the red close button —
/// used after posting an ad so the review-time note is actually read.
/// [subtitleTransliteration] renders below the subtitle in italic
/// (romanized Nepali for the English locale).
Future<void> showSuccessDialog(
  BuildContext context, {
  required String message,
  String? subtitle,
  String? subtitleTransliteration,
  Duration autoDismiss = const Duration(milliseconds: 1800),
}) {
  final manualDismiss = subtitle != null;
  return showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) {
      if (!manualDismiss) {
        Future.delayed(autoDismiss, () {
          if (ctx.mounted) Navigator.of(ctx).pop();
        });
      }
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Padding(
              padding: EdgeInsets.only(
                top: manualDismiss ? 40 : 32,
                bottom: 32,
                left: 24,
                right: 24,
              ),
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
                  if (subtitle != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.4,
                        color: Colors.grey.shade700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  if (subtitleTransliteration != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      subtitleTransliteration,
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
            if (manualDismiss)
              Positioned(
                top: -12,
                right: -12,
                child: Material(
                  color: const Color(0xFFEF4444),
                  shape: const CircleBorder(),
                  elevation: 3,
                  child: InkWell(
                    customBorder: const CircleBorder(),
                    onTap: () => Navigator.of(ctx).pop(),
                    child: const Padding(
                      padding: EdgeInsets.all(9),
                      child: Icon(Icons.close, color: Colors.white, size: 22),
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
    },
  );
}
