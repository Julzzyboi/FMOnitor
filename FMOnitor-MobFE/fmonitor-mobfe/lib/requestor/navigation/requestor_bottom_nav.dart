import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:fmonitor/common/navigation/nav_bar_item.dart';

/// The requestor's floating bottom nav - same pill styling and item
/// treatment as the hauler's, just a plain rounded rect (no notch/FAB,
/// since the requestor has no QR-scan destination) with four evenly
/// spaced items.
class RequestorBottomNav extends StatelessWidget {
  const RequestorBottomNav({super.key, required this.currentIndex, required this.onSelect});

  final int currentIndex;
  final ValueChanged<int> onSelect;

  static const double _barHeight = 66;

  /// Mirrors the hauler bar's [reservedHeight] so scrollable pages under
  /// either bar reserve the right amount of bottom clearance.
  static double reservedHeight(BuildContext context) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    return bottomInset + 14 + _barHeight;
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
            child: Container(
              height: _barHeight,
              decoration: BoxDecoration(color: NavBarColors.bar, borderRadius: BorderRadius.circular(30)),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
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
                    NavBarItem(
                      icon: FontAwesomeIcons.locationDot,
                      label: 'Track',
                      selected: currentIndex == 2,
                      onTap: () => onSelect(2),
                    ),
                    NavBarItem(
                      icon: FontAwesomeIcons.clockRotateLeft,
                      label: 'History',
                      selected: currentIndex == 3,
                      onTap: () => onSelect(3),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
