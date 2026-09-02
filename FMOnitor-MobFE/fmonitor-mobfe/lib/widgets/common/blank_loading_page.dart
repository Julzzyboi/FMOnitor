import 'package:flutter/material.dart';
import 'skeleton_loader.dart';

/// The shared body for every nav destination: briefly shows a skeleton
/// loader (standing in for a real data fetch that isn't wired up yet), then
/// fades into either a blank page or, if [child] is given, whatever content
/// that page wants to reveal instead (e.g. a placeholder empty state).
/// Every tab reuses this so the loading behaviour stays consistent app-wide.
class BlankLoadingPage extends StatefulWidget {
  const BlankLoadingPage({super.key, this.child});

  final Widget? child;

  @override
  State<BlankLoadingPage> createState() => _BlankLoadingPageState();
}

class _BlankLoadingPageState extends State<BlankLoadingPage> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 900), () {
      if (mounted) setState(() => _loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 350),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      child: _loading
          ? const PageSkeleton(key: ValueKey('skeleton'))
          : KeyedSubtree(
              key: const ValueKey('content'),
              child: widget.child ?? const SizedBox.expand(),
            ),
    );
  }
}
