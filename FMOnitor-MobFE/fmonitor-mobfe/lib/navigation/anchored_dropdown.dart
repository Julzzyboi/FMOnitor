import 'package:flutter/material.dart';

/// Opens/closes a floating panel anchored to a [LayerLink], with a fade +
/// scale entrance/exit. This is the mobile equivalent of the web app's
/// portal-based floating dropdowns: one reusable controller instead of
/// duplicating overlay/animation plumbing in every dropdown.
class AnchoredDropdownController {
  OverlayEntry? _entry;
  AnimationController? _animation;

  bool get isOpen => _entry != null;

  void toggle({
    required BuildContext context,
    required LayerLink link,
    required TickerProvider vsync,
    required WidgetBuilder builder,
  }) {
    if (isOpen) {
      close();
    } else {
      open(context: context, link: link, vsync: vsync, builder: builder);
    }
  }

  void open({
    required BuildContext context,
    required LayerLink link,
    required TickerProvider vsync,
    required WidgetBuilder builder,
  }) {
    final controller = AnimationController(
      vsync: vsync,
      duration: const Duration(milliseconds: 180),
    );
    _animation = controller;

    final entry = OverlayEntry(
      builder: (overlayContext) {
        return Stack(
          children: [
            // Invisible barrier: tapping anywhere outside the dropdown
            // closes it, mirroring the web app's click-outside behaviour.
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onTap: close,
              ),
            ),
            CompositedTransformFollower(
              link: link,
              showWhenUnlinked: false,
              targetAnchor: Alignment.bottomRight,
              followerAnchor: Alignment.topRight,
              offset: const Offset(0, 10),
              child: AnimatedBuilder(
                animation: controller,
                builder: (context, child) {
                  return Opacity(
                    opacity: controller.value,
                    child: Transform.scale(
                      scale: 0.92 + controller.value * 0.08,
                      alignment: Alignment.topRight,
                      child: child,
                    ),
                  );
                },
                child: Material(
                  color: Colors.transparent,
                  child: builder(overlayContext),
                ),
              ),
            ),
          ],
        );
      },
    );

    _entry = entry;
    Overlay.of(context).insert(entry);
    controller.forward();
  }

  void close() {
    final controller = _animation;
    final entry = _entry;
    if (controller == null || entry == null) return;
    _entry = null;
    _animation = null;
    controller.reverse().whenCompleteOrCancel(() {
      entry.remove();
      controller.dispose();
    });
  }

  void dispose() {
    _animation?.dispose();
    _entry?.remove();
  }
}
