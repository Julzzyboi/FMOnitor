import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/skeleton_loader.dart';

/// The shape of the hauler's next scheduled tickets - a couple of rows
/// standing in for however many will actually be there.
class UpcomingAssignments extends StatelessWidget {
  const UpcomingAssignments({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderGray),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        children: [
          _TicketRow(),
          Divider(height: 1, color: AppColors.borderGray),
          _TicketRow(),
        ],
      ),
    );
  }
}

class _TicketRow extends StatelessWidget {
  const _TicketRow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.amber100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Center(
              child: FaIcon(FontAwesomeIcons.clipboard, size: 16, color: AppColors.amber400),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 100, height: 12, borderRadius: 4),
                SizedBox(height: 6),
                SkeletonBox(width: 160, height: 12, borderRadius: 4),
                SizedBox(height: 8),
                SkeletonBox(width: double.infinity, height: 10, borderRadius: 4),
                SizedBox(height: 6),
                SkeletonBox(width: 130, height: 10, borderRadius: 4),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const SkeletonBox(width: 62, height: 18, borderRadius: 999),
              const SizedBox(height: 18),
              const Icon(Icons.chevron_right, size: 18, color: AppColors.textMuted),
            ],
          ),
        ],
      ),
    );
  }
}
