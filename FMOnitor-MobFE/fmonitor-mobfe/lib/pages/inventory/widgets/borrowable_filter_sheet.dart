import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';
import 'borrowable_filter.dart';

/// Bottom sheet listing the three borrowable-status options. Slides up from
/// the bottom the same way the Storage Areas sheet does.
Future<void> showBorrowableFilterSheet({
  required BuildContext context,
  required BorrowableFilter selected,
  required ValueChanged<BorrowableFilter> onSelect,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (sheetContext) => _BorrowableFilterSheet(selected: selected, onSelect: onSelect),
  );
}

class _BorrowableFilterSheet extends StatelessWidget {
  const _BorrowableFilterSheet({required this.selected, required this.onSelect});

  final BorrowableFilter selected;
  final ValueChanged<BorrowableFilter> onSelect;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 10),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.borderGray, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Row(
              children: [
                Text('Filter', style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: [
                for (final filter in BorrowableFilter.values) ...[
                  if (filter != BorrowableFilter.values.first) const Divider(height: 1, color: AppColors.borderGray),
                  _FilterTile(filter: filter, isSelected: filter == selected, onSelect: onSelect),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _FilterTile extends StatelessWidget {
  const _FilterTile({required this.filter, required this.isSelected, required this.onSelect});

  final BorrowableFilter filter;
  final bool isSelected;
  final ValueChanged<BorrowableFilter> onSelect;

  @override
  Widget build(BuildContext context) {
    return TapScale(
      scale: 0.98,
      onTap: () {
        onSelect(filter);
        Navigator.of(context).pop();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
        child: Row(
          children: [
            Icon(
              filter == BorrowableFilter.nonBorrowable ? Icons.block : Icons.check_circle_outline,
              size: 18,
              color: isSelected ? AppColors.waveBlack : AppColors.textMuted,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                filter.label,
                style: GoogleFonts.montserrat(
                  fontSize: 13.5,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: AppColors.textDark,
                ),
              ),
            ),
            if (isSelected) const Icon(Icons.check_circle, size: 18, color: AppColors.yellow),
          ],
        ),
      ),
    );
  }
}
