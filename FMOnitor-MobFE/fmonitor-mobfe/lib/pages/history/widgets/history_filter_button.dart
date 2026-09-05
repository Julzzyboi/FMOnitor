import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/history_log_entry.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// Opens the activity-type picker. Shows "All Activity" when nothing is
/// selected, or the chosen type's name (with a clear "x") once one is.
class HistoryFilterButton extends StatelessWidget {
  const HistoryFilterButton({super.key, required this.selected, required this.onTap, required this.onClear});

  final HistoryLogType? selected;
  final VoidCallback onTap;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final active = selected != null;
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
            Icon(
              active ? selected!.icon : Icons.filter_alt_outlined,
              size: 15,
              color: active ? AppColors.waveBlack : AppColors.textSubtitle,
            ),
            const SizedBox(width: 6),
            Text(
              active ? selected!.label : 'All Activity',
              style: GoogleFonts.montserrat(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: active ? AppColors.waveBlack : AppColors.textSubtitle,
              ),
            ),
            const SizedBox(width: 4),
            if (active)
              GestureDetector(
                onTap: onClear,
                child: const Icon(Icons.close, size: 15, color: AppColors.waveBlack),
              )
            else
              const Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.textSubtitle),
          ],
        ),
      ),
    );
  }
}
