import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/history_log_data.dart';
import '../../../data/history_log_entry.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// Bottom sheet listing "All Activity" plus every [HistoryLogType], each
/// with its entry count. Picking one filters the log list down to just
/// that type.
Future<void> showHistoryFilterSheet({
  required BuildContext context,
  required HistoryLogType? selected,
  required ValueChanged<HistoryLogType?> onSelect,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (sheetContext) => _HistoryFilterSheet(selected: selected, onSelect: onSelect),
  );
}

class _HistoryFilterSheet extends StatelessWidget {
  const _HistoryFilterSheet({required this.selected, required this.onSelect});

  final HistoryLogType? selected;
  final ValueChanged<HistoryLogType?> onSelect;

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
                Text('Filter Activity', style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: [
                _FilterTile(
                  icon: Icons.all_inbox_outlined,
                  label: 'All Activity',
                  count: countForType(null),
                  isSelected: selected == null,
                  onTap: () => onSelect(null),
                ),
                for (final type in HistoryLogType.values) ...[
                  const Divider(height: 1, color: AppColors.borderGray),
                  _FilterTile(
                    icon: type.icon,
                    label: type.label,
                    count: countForType(type),
                    isSelected: selected == type,
                    onTap: () => onSelect(type),
                  ),
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
  const _FilterTile({
    required this.icon,
    required this.label,
    required this.count,
    required this.isSelected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final int count;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TapScale(
      scale: 0.98,
      onTap: () {
        onTap();
        Navigator.of(context).pop();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 18, color: isSelected ? AppColors.waveBlack : AppColors.textMuted),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.montserrat(
                  fontSize: 13.5,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: AppColors.textDark,
                ),
              ),
            ),
            Text('$count', style: GoogleFonts.montserrat(fontSize: 12, color: AppColors.textMuted)),
            if (isSelected) ...[
              const SizedBox(width: 10),
              const Icon(Icons.check_circle, size: 18, color: AppColors.yellow),
            ],
          ],
        ),
      ),
    );
  }
}
