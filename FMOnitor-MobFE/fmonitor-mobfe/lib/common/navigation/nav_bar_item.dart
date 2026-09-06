import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../widgets/tap_scale.dart';

/// Bar chrome shared by every role's floating bottom nav, so they all read
/// as the same component family even though each role's bar has a
/// different item count (and only the hauler's has a notch for its FAB).
class NavBarColors {
  NavBarColors._();
  static const Color bar = Color(0xFF0C0C0E); // darker than the login wave gray
  static const Color inactive = Color(0xFF87878D);
}

/// One icon-on-top, label-below destination in a floating bottom nav bar.
class NavBarItem extends StatelessWidget {
  const NavBarItem({
    super.key,
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
    final color = selected ? AppColors.yellow : NavBarColors.inactive;
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
