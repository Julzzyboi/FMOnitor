import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// The wave band along the bottom of the login page. The wavy transition
/// itself stays a fixed, natural-looking amplitude (curveHeight) regardless
/// of how tall the whole band is - the extra room needed to fit content
/// inside the band (totalHeight) is just a flat fill below the curve, so
/// making the band taller doesn't distort/exaggerate the wave shape.
class WaveFooter extends StatelessWidget {
  const WaveFooter({
    super.key,
    required this.totalHeight,
    this.curveHeight = 110,
    this.color = AppColors.waveGray,
  });

  final double totalHeight;
  final double curveHeight;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: totalHeight,
      child: CustomPaint(
        painter: _WavePainter(curveHeight: curveHeight, color: color),
      ),
    );
  }
}

class _WavePainter extends CustomPainter {
  _WavePainter({required this.curveHeight, required this.color});

  final double curveHeight;
  final Color color;

  // Source viewBox from the web app's WaveFooter.jsx, but only for the curve
  // zone (curveHeight) - the flat band below it is added separately.
  static const double _viewW = 1536;
  static const double _viewH = 200;

  Offset _p(double width, double x, double y) {
    return Offset(x / _viewW * width, y / _viewH * curveHeight);
  }

  Path _curvePath(double width) {
    final path = Path()..moveTo(_p(width, 0, 30).dx, _p(width, 0, 30).dy);
    path.cubicTo(
      _p(width, 420, 170).dx,
      _p(width, 420, 170).dy,
      _p(width, 780, 170).dx,
      _p(width, 780, 170).dy,
      _p(width, 1040, 90).dx,
      _p(width, 1040, 90).dy,
    );
    path.cubicTo(
      _p(width, 1240, 30).dx,
      _p(width, 1240, 30).dy,
      _p(width, 1400, 10).dx,
      _p(width, 1400, 10).dy,
      _p(width, 1536, 20).dx,
      _p(width, 1536, 20).dy,
    );
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final fillPath = _curvePath(size.width)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(fillPath, Paint()..color = color);

    final strokeWidth = 12 / _viewH * curveHeight;
    canvas.drawPath(
      _curvePath(size.width),
      Paint()
        ..color = AppColors.waveBorder
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _WavePainter oldDelegate) {
    return oldDelegate.curveHeight != curveHeight || oldDelegate.color != color;
  }
}
