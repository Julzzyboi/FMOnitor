import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// Opens the storage-area picker. Shows "Storage Areas" when nothing is
/// selected, or the chosen area's name (with a clear "x") once one is.
class StorageAreaButton extends StatelessWidget {
  const StorageAreaButton({super.key, required this.selectedArea, required this.onTap, required this.onClear});

  final String? selectedArea;
  final VoidCallback onTap;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final active = selectedArea != null;
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
            Icon(Icons.filter_alt_outlined, size: 15, color: active ? AppColors.waveBlack : AppColors.textSubtitle),
            const SizedBox(width: 6),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 160),
              child: Text(
                active ? selectedArea! : 'Storage Areas',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.montserrat(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  color: active ? AppColors.waveBlack : AppColors.textSubtitle,
                ),
              ),
            ),
            if (active) ...[
              const SizedBox(width: 6),
              GestureDetector(
                onTap: onClear,
                child: const Icon(Icons.close, size: 15, color: AppColors.waveBlack),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
