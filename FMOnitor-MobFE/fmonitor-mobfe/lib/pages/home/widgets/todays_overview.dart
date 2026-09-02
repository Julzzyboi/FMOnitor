import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/skeleton_loader.dart';

/// A quick "at a glance" summary - plain numbers (once real), no charts.
/// Each tile's label is a fixed category name that stays regardless of the
/// actual count, so it's kept as real text; the count itself is a bar.
class TodaysOverview extends StatelessWidget {
  const TodaysOverview({super.key});

  static const _tiles = [
    (icon: FontAwesomeIcons.clipboardList, label: 'Assigned Tickets', color: AppColors.amber400, bg: AppColors.amber100),
    (icon: FontAwesomeIcons.truckFast, label: 'In Progress', color: AppColors.statusGreen, bg: AppColors.statusGreenBg),
    (icon: FontAwesomeIcons.circleCheck, label: 'Completed', color: AppColors.statusBlue, bg: AppColors.statusBlueBg),
    (icon: FontAwesomeIcons.clock, label: 'Time Online', color: AppColors.statusPurple, bg: AppColors.statusPurpleBg),
  ];

  @override
  Widget build(BuildContext context) {
    // Rows of Expanded tiles instead of a GridView+childAspectRatio -
    // aspect-ratio math was making each cell far taller than its actual
    // content needed, leaving a lot of dead space below the grid. This
    // sizes each row to its real content height instead.
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _StatTile(tile: _tiles[0])),
            const SizedBox(width: 10),
            Expanded(child: _StatTile(tile: _tiles[1])),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(child: _StatTile(tile: _tiles[2])),
            const SizedBox(width: 10),
            Expanded(child: _StatTile(tile: _tiles[3])),
          ],
        ),
      ],
    );
  }
}

typedef _Tile = ({FaIconData icon, String label, Color color, Color bg});

class _StatTile extends StatelessWidget {
  const _StatTile({required this.tile});

  final _Tile tile;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderGray),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(color: tile.bg, borderRadius: BorderRadius.circular(9)),
            child: Center(child: FaIcon(tile.icon, size: 13, color: tile.color)),
          ),
          const SizedBox(height: 12),
          const SkeletonBox(width: 36, height: 18, borderRadius: 4),
          const SizedBox(height: 4),
          Text(
            tile.label,
            style: GoogleFonts.montserrat(fontSize: 11, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }
}
