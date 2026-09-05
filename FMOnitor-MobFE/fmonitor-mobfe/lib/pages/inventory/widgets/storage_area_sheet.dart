import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/inventory_data.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// Bottom sheet listing every storage area with its item count. Picking one
/// filters the inventory list down to just that area's equipment.
Future<void> showStorageAreaSheet({
  required BuildContext context,
  required String? selected,
  required ValueChanged<String?> onSelect,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    builder: (sheetContext) => _StorageAreaSheet(selected: selected, onSelect: onSelect),
  );
}

class _StorageAreaSheet extends StatelessWidget {
  const _StorageAreaSheet({required this.selected, required this.onSelect});

  final String? selected;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    final areas = kStorageAreas;
    return SafeArea(
      top: false,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.borderGray, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Row(
                children: [
                  Text('Storage Areas', style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                  const Spacer(),
                  if (selected != null)
                    TapScale(
                      onTap: () {
                        onSelect(null);
                        Navigator.of(context).pop();
                      },
                      child: Text('Clear', style: GoogleFonts.montserrat(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
                    ),
                ],
              ),
            ),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                itemCount: areas.length,
                separatorBuilder: (_, _) => const Divider(height: 1, color: AppColors.borderGray),
                itemBuilder: (context, index) {
                  final area = areas[index];
                  final isSelected = area == selected;
                  return TapScale(
                    scale: 0.98,
                    onTap: () {
                      onSelect(area);
                      Navigator.of(context).pop();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
                      child: Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 18, color: isSelected ? AppColors.waveBlack : AppColors.textMuted),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              area,
                              style: GoogleFonts.montserrat(
                                fontSize: 13.5,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: AppColors.textDark,
                              ),
                            ),
                          ),
                          Text(
                            '${itemCountForArea(area)}',
                            style: GoogleFonts.montserrat(fontSize: 12, color: AppColors.textMuted),
                          ),
                          if (isSelected) ...[
                            const SizedBox(width: 10),
                            const Icon(Icons.check_circle, size: 18, color: AppColors.yellow),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
