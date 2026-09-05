import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';
import 'calendar_view_mode.dart';

/// The "< label >" row above the day grid/row. [label] is whatever the
/// current view mode wants shown - a month+year in Detailed, a date range
/// in Minimal. Tapping the label itself toggles between the two views -
/// no separate dropdown, just a direct press-to-switch, with a chevron
/// that flips to hint the label is interactive.
class MonthHeader extends StatelessWidget {
  const MonthHeader({
    super.key,
    required this.label,
    required this.viewMode,
    required this.onPrev,
    required this.onNext,
    required this.onToggleView,
  });

  final String label;
  final CalendarViewMode viewMode;
  final VoidCallback onPrev;
  final VoidCallback onNext;
  final VoidCallback onToggleView;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _NavButton(icon: Icons.chevron_left, onTap: onPrev),
        Expanded(
          child: TapScale(
            onTap: onToggleView,
            scale: 0.97,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Flexible(
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.montserrat(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                ),
                const SizedBox(width: 6),
                Icon(
                  viewMode == CalendarViewMode.detailed ? Icons.expand_less : Icons.expand_more,
                  size: 22,
                  color: AppColors.textSubtitle,
                ),
              ],
            ),
          ),
        ),
        _NavButton(icon: Icons.chevron_right, onTap: onNext),
      ],
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TapScale(
      onTap: onTap,
      scale: 0.9,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.borderGray),
        ),
        child: Icon(icon, size: 20, color: AppColors.textSubtitle),
      ),
    );
  }
}
