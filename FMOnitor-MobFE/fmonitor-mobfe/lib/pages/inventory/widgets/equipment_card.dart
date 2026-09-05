import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/inventory_item.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';
import 'equipment_thumbnail.dart';

/// One row in the inventory list: the equipment's photo, name, and its
/// quantity + storage area on one line - exactly the fields the registry
/// list is meant to surface, nothing more.
class EquipmentCard extends StatelessWidget {
  const EquipmentCard({super.key, required this.item, required this.onTap});

  final InventoryItem item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TapScale(
      onTap: onTap,
      scale: 0.98,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.borderGray),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 56,
              height: 56,
              child: EquipmentThumbnail(imageAsset: item.imageAsset, borderRadius: 12),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.montserrat(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      Text(
                        'QTY ${item.quantity}',
                        style: GoogleFonts.montserrat(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                      ),
                      const SizedBox(width: 6),
                      const Text('•', style: TextStyle(color: AppColors.textMuted)),
                      const SizedBox(width: 6),
                      const Icon(Icons.location_on_outlined, size: 13, color: AppColors.textMuted),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          item.location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.montserrat(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, size: 20, color: AppColors.amber400),
          ],
        ),
      ),
    );
  }
}
