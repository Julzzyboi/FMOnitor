import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

import 'package:fmonitor/common/navigation/nav_bar_item.dart';
import 'qr_fab_button.dart';

/// A floating, rounded nav bar with margin on both sides (not edge-to-edge)
/// so it reads as a modern "pill" rather than a dense edge-to-edge strip.
/// Every destination is a plain icon-on-top, label-below item - no
/// expand/collapse animation, just a tap-scale for feedback. The QR
/// destination floats above the bar as a [QrFabButton]; the bar itself has
/// a circular gap punched out behind it, so the page background peeks
/// through around the button instead of it sitting flush on solid bar.
class AppBottomNavBar extends StatelessWidget {
  const AppBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onSelect,
  });

  final int currentIndex;
  final ValueChanged<int> onSelect;

  static const int qrIndex = 2;
  static const double _barHeight = 66;
  static const double _fabSize = 60;

  /// The bar's full footprint (bar + the QR button poking above it + the
  /// device's bottom safe area). Since the bar floats over page content
  /// (`extendBody: true`), a scrollable page needs to reserve at least
  /// this much bottom padding, or its last bit of content ends up stuck
  /// underneath the bar with no way to scroll it into view.
  static double reservedHeight(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return bottomInset + 14 + _barHeight + (_fabSize / 2 - 8);
  }

  @override
  Widget build(BuildContext context) {
    final barBottom = MediaQuery.of(context).padding.bottom + 14;

    return SizedBox(
      height: reservedHeight(context),
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.bottomCenter,
        children: [
          Positioned(
            left: 14,
            right: 14,
            bottom: barBottom,
            child: SizedBox(
              height: _barHeight,
              // PhysicalShape's elevation shadow doesn't composite opaquely
              // with this notched path on every renderer (it let content
              // bleed through the whole bar, not just the notch) - a plain
              // ClipPath + Container guarantees a solid fill instead. No
              // drop shadow - just the flat notched shape.
              child: ClipPath(
                clipper: const _NotchedPillClipper(
                  borderRadius: 30,
                  // The QR button's center sits 8px below the bar's own
                  // top edge (see the FAB's Positioned math below) - the
                  // notch is centered there, sized a bit past the
                  // button's own white ring so a sliver of background
                  // shows through.
                  notchCenterY: 8,
                  notchRadius: (_fabSize / 2) + 8,
                ),
                child: Container(
                  color: NavBarColors.bar,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: Row(
                      children: [
                        // Each half is exactly half the bar's width, so the
                        // reserved QR gap always lands dead-center - matching
                        // the FAB above, which is centered on the whole bar.
                        // Splitting the row this way (rather than one flat
                        // spaceBetween row) is what keeps the gap on both
                        // sides of the QR button equal, regardless of how
                        // wide each label is.
                        Expanded(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              NavBarItem(
                                icon: FontAwesomeIcons.house,
                                label: 'Home',
                                selected: currentIndex == 0,
                                onTap: () => onSelect(0),
                              ),
                              NavBarItem(
                                icon: FontAwesomeIcons.calendarDays,
                                label: 'Calendar',
                                selected: currentIndex == 1,
                                onTap: () => onSelect(1),
                              ),
                            ],
                          ),
                        ),
                        // Reserved, fixed gap - the QR FAB floats above this spot.
                        const SizedBox(width: _fabSize - 8),
                        Expanded(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            children: [
                              NavBarItem(
                                icon: FontAwesomeIcons.boxesStacked,
                                label: 'Inventory',
                                selected: currentIndex == 3,
                                onTap: () => onSelect(3),
                              ),
                              NavBarItem(
                                icon: FontAwesomeIcons.clockRotateLeft,
                                label: 'History',
                                selected: currentIndex == 4,
                                onTap: () => onSelect(4),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: barBottom + _barHeight - (_fabSize / 2) - 8,
            child: QrFabButton(onTap: () => onSelect(qrIndex)),
          ),
        ],
      ),
    );
  }
}

/// Clips a rounded-rect pill with the authentic Material notch curve (the
/// same shallow, tapered scoop [BottomAppBar] uses for a docked FAB) cut
/// into its top edge - not a plain punched-out circle, which either looks
/// like a hole rather than a notch or (if capped to avoid that) loses the
/// visible gap around the button entirely.
class _NotchedPillClipper extends CustomClipper<Path> {
  const _NotchedPillClipper({
    required this.borderRadius,
    required this.notchCenterY,
    required this.notchRadius,
  });

  final double borderRadius;
  final double notchCenterY;
  final double notchRadius;

  static const _notchShape = CircularNotchedRectangle();

  @override
  Path getClip(Size size) {
    final host = Offset.zero & size;
    final guest = Rect.fromCircle(
      center: Offset(size.width / 2, notchCenterY),
      radius: notchRadius,
    );
    final notchedRectPath = _notchShape.getOuterPath(host, guest);
    // getOuterPath assumes sharp rectangular corners; intersecting with our
    // own rounded rect clips just the four corners round, leaving the
    // notch curve (nowhere near them) untouched.
    final roundedRectPath = Path()
      ..addRRect(RRect.fromRectAndRadius(host, Radius.circular(borderRadius)));
    return Path.combine(PathOperation.intersect, notchedRectPath, roundedRectPath);
  }

  @override
  bool shouldReclip(covariant _NotchedPillClipper oldClipper) {
    return oldClipper.borderRadius != borderRadius ||
        oldClipper.notchCenterY != notchCenterY ||
        oldClipper.notchRadius != notchRadius;
  }
}
