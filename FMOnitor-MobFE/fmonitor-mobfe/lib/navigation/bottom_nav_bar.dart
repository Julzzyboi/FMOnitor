import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import '../widgets/common/tap_scale.dart';
import 'qr_fab_button.dart';

const Color _barColor = Color(0xFF0C0C0E); // darker than the login wave gray
const Color _inactiveColor = Color(0xFF87878D);

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
              // ClipPath + Container guarantees a solid fill, with the
              // shadow approximated separately behind it (a plain rounded
              // rect; the blur hides the difference from the actual notch).
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                  ),
                  ClipPath(
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
                      color: _barColor,
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
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: [
                                  _NavItem(
                                    icon: FontAwesomeIcons.house,
                                    label: 'Home',
                                    selected: currentIndex == 0,
                                    onTap: () => onSelect(0),
                                  ),
                                  _NavItem(
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
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: [
                                  _NavItem(
                                    icon: FontAwesomeIcons.boxesStacked,
                                    label: 'Inventory',
                                    selected: currentIndex == 3,
                                    onTap: () => onSelect(3),
                                  ),
                                  _NavItem(
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
                ],
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

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final FaIconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.yellow : _inactiveColor;
    return TapScale(
      key: ValueKey('nav_$label'),
      onTap: onTap,
      scale: 0.9,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FaIcon(icon, size: 18, color: color),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.montserrat(
                fontSize: 8.5,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
