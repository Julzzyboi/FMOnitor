import 'package:flutter/material.dart';

/// Wraps any widget with the same tactile press-scale feedback used across
/// the app (the Google sign-in button, bottom nav items, the QR FAB, topbar
/// icon buttons) so every tappable control feels consistent.
class TapScale extends StatefulWidget {
  const TapScale({
    super.key,
    required this.onTap,
    required this.child,
    this.scale = 0.93,
  });

  final VoidCallback onTap;
  final Widget child;
  final double scale;

  @override
  State<TapScale> createState() => _TapScaleState();
}

class _TapScaleState extends State<TapScale> {
  bool _pressed = false;

  void _setPressed(bool value) => setState(() => _pressed = value);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _setPressed(true),
      onTapUp: (_) => _setPressed(false),
      onTapCancel: () => _setPressed(false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? widget.scale : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}
