import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/inventory_item.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common/detail_pill.dart';
import '../../widgets/common/detail_row.dart';
import 'widgets/equipment_thumbnail.dart';

/// The full-detail view for one piece of equipment - just its photo and the
/// fields the registry tracks (quantity, storage area, borrowable status),
/// laid out larger than the list card rather than adding new information.
class EquipmentDetailPage extends StatelessWidget {
  const EquipmentDetailPage({super.key, required this.item});

  final InventoryItem item;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.white,
        foregroundColor: AppColors.textDark,
        title: Text(
          'Equipment Details',
          style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: EquipmentThumbnail(imageAsset: item.imageAsset, borderRadius: 20, iconSize: 56),
              ),
              const SizedBox(height: 20),
              Text(
                item.name,
                style: GoogleFonts.montserrat(fontSize: 21, fontWeight: FontWeight.w700, color: AppColors.textDark),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  DetailPill(
                    icon: item.borrowable ? Icons.check_circle_outline : Icons.block,
                    label: item.borrowable ? 'Borrowable' : 'Non-Borrowable',
                    background: item.borrowable ? AppColors.statusGreenBg : AppColors.borderGray,
                    foreground: item.borrowable ? AppColors.statusGreen : AppColors.textMuted,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const DetailDivider(),
              DetailRow(icon: Icons.inventory_2_outlined, label: 'Quantity Available', value: '${item.quantity}'),
              const DetailDivider(),
              DetailRow(icon: Icons.location_on_outlined, label: 'Storage Area', value: item.location),
              const DetailDivider(),
            ],
          ),
        ),
      ),
    );
  }
}
