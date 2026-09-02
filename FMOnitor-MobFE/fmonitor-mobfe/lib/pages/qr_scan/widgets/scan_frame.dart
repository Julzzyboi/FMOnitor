import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../theme/app_colors.dart';

/// The classic scanner viewfinder square: a faint outline with four yellow
/// corner brackets, standing in for the live camera crop area.
class ScanFrame extends StatelessWidget {
  const ScanFrame({super.key, this.size = 260});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          const Align(alignment: Alignment.topLeft, child: _CornerBracket(top: true, left: true)),
          const Align(alignment: Alignment.topRight, child: _CornerBracket(top: true, left: false)),
          const Align(alignment: Alignment.bottomLeft, child: _CornerBracket(top: false, left: true)),
          const Align(alignment: Alignment.bottomRight, child: _CornerBracket(top: false, left: false)),
        ],
      ),
    );
  }
}

/// Painted rather than built from a bordered+radius [Container]: Flutter
/// only honors [BoxDecoration.borderRadius] when all four border sides are
/// uniform, and a corner bracket only has two active sides - so that
/// approach silently dropped the curve and left a hard square notch at the
/// join instead. A [CustomPainter] draws the exact L-shape (two straight
/// legs joined by one quarter-circle arc at the frame's outer corner) with
/// no such caveat.
class _CornerBracket extends StatelessWidget {
  const _CornerBracket({required this.top, required this.left});

  final bool top;
  final bool left;

  static const _side = 32.0;
  static const _radius = 16.0;
  static const _strokeWidth = 4.0;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(_side, _side),
      painter: _BracketPainter(top: top, left: left, radius: _radius, strokeWidth: _strokeWidth),
    );
  }
}

class _BracketPainter extends CustomPainter {
  const _BracketPainter({
    required this.top,
    required this.left,
    required this.radius,
    required this.strokeWidth,
  });

  final bool top;
  final bool left;
  final double radius;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.yellow
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final w = size.width;
    final h = size.height;
    final path = Path();

    if (top && left) {
      final center = Offset(radius, radius);
      path
        ..moveTo(w, 0)
        ..lineTo(radius, 0)
        ..arcTo(Rect.fromCircle(center: center, radius: radius), -math.pi / 2, -math.pi / 2, false)
        ..lineTo(0, h);
    } else if (top && !left) {
      final center = Offset(w - radius, radius);
      path
        ..moveTo(0, 0)
        ..lineTo(w - radius, 0)
        ..arcTo(Rect.fromCircle(center: center, radius: radius), -math.pi / 2, math.pi / 2, false)
        ..lineTo(w, h);
    } else if (!top && left) {
      final center = Offset(radius, h - radius);
      path
        ..moveTo(w, h)
        ..lineTo(radius, h)
        ..arcTo(Rect.fromCircle(center: center, radius: radius), math.pi / 2, math.pi / 2, false)
        ..lineTo(0, 0);
    } else {
      final center = Offset(w - radius, h - radius);
      path
        ..moveTo(0, h)
        ..lineTo(w - radius, h)
        ..arcTo(Rect.fromCircle(center: center, radius: radius), math.pi / 2, -math.pi / 2, false)
        ..lineTo(w, 0);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _BracketPainter oldDelegate) => false;
}
