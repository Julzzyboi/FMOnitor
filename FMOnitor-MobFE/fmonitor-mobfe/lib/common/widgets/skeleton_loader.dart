import 'package:flutter/material.dart';

/// A single pulsing placeholder block, the basic unit of a skeleton loader.
class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  final double width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: Container(
        width: width,
        height: height,
        color: const Color(0xFFE9E9EA),
      ),
    );
  }
}

/// Wraps its skeleton placeholder in a slow opacity pulse, the standard
/// "loading" cue used everywhere in the app while real data isn't wired up
/// yet.
class SkeletonPulse extends StatefulWidget {
  const SkeletonPulse({super.key, required this.child});

  final Widget child;

  @override
  State<SkeletonPulse> createState() => _SkeletonPulseState();
}

class _SkeletonPulseState extends State<SkeletonPulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _opacity = Tween<double>(begin: 0.45, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _opacity,
      builder: (context, child) => Opacity(opacity: _opacity.value, child: child),
      child: widget.child,
    );
  }
}

/// A generic full-page skeleton: a header bar plus a few card-shaped
/// placeholders, used as the "loading" state for every blank page before
/// real content/data exists.
class PageSkeleton extends StatelessWidget {
  const PageSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SkeletonPulse(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const SkeletonBox(width: 140, height: 18, borderRadius: 4),
          const SizedBox(height: 20),
          SkeletonBox(width: double.infinity, height: 110, borderRadius: 16),
          const SizedBox(height: 16),
          SkeletonBox(width: double.infinity, height: 110, borderRadius: 16),
          const SizedBox(height: 16),
          SkeletonBox(width: double.infinity, height: 110, borderRadius: 16),
        ],
      ),
    );
  }
}
