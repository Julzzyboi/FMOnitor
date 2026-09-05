import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

enum BorrowableFilter { all, borrowable, nonBorrowable }

extension BorrowableFilterLabel on BorrowableFilter {
  String get label => switch (this) {
        BorrowableFilter.all => 'All',
        BorrowableFilter.borrowable => 'Borrowable',
        BorrowableFilter.nonBorrowable => 'Non-Borrowable',
      };
}

/// Opens the borrowable-status picker (a slide-up sheet, matching Storage
/// Areas) - shows the current selection with a dropdown chevron.
class BorrowableFilterButton extends StatelessWidget {
  const BorrowableFilterButton({super.key, required this.value, required this.onTap});

  final BorrowableFilter value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final active = value != BorrowableFilter.all;
    return TapScale(
      onTap: onTap,
      scale: 0.97,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.amber100 : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: active ? AppColors.amber400 : AppColors.borderGray),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value.label,
              style: GoogleFonts.montserrat(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: active ? AppColors.waveBlack : AppColors.textSubtitle,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down, size: 16, color: active ? AppColors.waveBlack : AppColors.textSubtitle),
          ],
        ),
      ),
    );
  }
}
