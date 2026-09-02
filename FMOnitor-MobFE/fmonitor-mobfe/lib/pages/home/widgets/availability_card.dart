import 'package:flutter/material.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/skeleton_loader.dart';

/// Where the hauler's availability status will eventually show - just the
/// shape of it, no toggle and no invented status text yet.
class AvailabilityCard extends StatelessWidget {
  const AvailabilityCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.borderGray.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SkeletonBox(width: 110, height: 13, borderRadius: 4),
          SizedBox(height: 8),
          SkeletonBox(width: 220, height: 12, borderRadius: 4),
        ],
      ),
    );
  }
}
