import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';

const _weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/// The Sun-Sat label row above both the month grid and the week row.
class WeekdayHeader extends StatelessWidget {
  const WeekdayHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: _weekdayLabels
          .map(
            (label) => Expanded(
              child: Center(
                child: Text(
                  label,
                  style: GoogleFonts.montserrat(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}
