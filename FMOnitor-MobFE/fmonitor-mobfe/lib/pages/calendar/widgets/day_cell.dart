import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// One tappable day in the grid or week row: the day number (highlighted
/// when selected, ringed when it's today) and a small dot underneath when
/// there's at least one delivery that day. Shared by [MonthGrid] and
/// [WeekRow] so both views render days identically.
class DayCell extends StatelessWidget {
  const DayCell({
    super.key,
    required this.day,
    required this.inCurrentPeriod,
    required this.isToday,
    required this.isSelected,
    required this.hasTasks,
    required this.onTap,
  });

  final DateTime day;

  /// Whether [day] belongs to the month/week actually being viewed, as
  /// opposed to a muted leading/trailing day from an adjacent one.
  final bool inCurrentPeriod;
  final bool isToday;
  final bool isSelected;
  final bool hasTasks;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textColor = isSelected
        ? AppColors.waveBlack
        : !inCurrentPeriod
            ? AppColors.textMuted.withValues(alpha: 0.5)
            : AppColors.textDark;

    return TapScale(
      onTap: onTap,
      scale: 0.9,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Column(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOut,
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.yellow : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
                border: isToday && !isSelected ? Border.all(color: AppColors.yellow, width: 1.5) : null,
              ),
              child: Text(
                '${day.day}',
                style: GoogleFonts.montserrat(
                  fontSize: 14,
                  fontWeight: isSelected || isToday ? FontWeight.w700 : FontWeight.w500,
                  color: textColor,
                ),
              ),
            ),
            const SizedBox(height: 3),
            SizedBox(
              width: 5,
              height: 5,
              child: hasTasks
                  ? DecoratedBox(
                      decoration: BoxDecoration(
                        color: inCurrentPeriod ? AppColors.amber400 : AppColors.amber400.withValues(alpha: 0.4),
                        shape: BoxShape.circle,
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}
