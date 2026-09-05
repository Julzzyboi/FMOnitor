import 'package:flutter/material.dart';
import '../../../data/history_log_entry.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/skeleton_loader.dart';

/// One row in the activity log. Only [entry.type] is real - the log text
/// and timestamp aren't designed/wired up yet, so they're skeleton shapes
/// rather than placeholder sentences, the same convention Home uses for
/// its not-yet-built sections. Every entry shares the same log icon - the
/// colored background is what still hints at its type; the filter's own
/// icons (which need to tell categories apart side by side) stay distinct.
class HistoryLogCard extends StatelessWidget {
  const HistoryLogCard({super.key, required this.entry, required this.index});

  final HistoryLogEntry entry;

  /// Varies the skeleton bar widths a little so the list doesn't look like
  /// a stack of identical rows.
  final int index;

  @override
  Widget build(BuildContext context) {
    const titleWidths = [150.0, 190.0, 130.0];
    const subtitleWidths = [110.0, 90.0, 130.0];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderGray),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: entry.type.background, borderRadius: BorderRadius.circular(12)),
            child: Icon(Icons.receipt_long_outlined, size: 20, color: entry.type.color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: titleWidths[index % titleWidths.length], height: 13, borderRadius: 4),
                const SizedBox(height: 8),
                SkeletonBox(width: subtitleWidths[index % subtitleWidths.length], height: 11, borderRadius: 4),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const SkeletonBox(width: 44, height: 10, borderRadius: 3),
        ],
      ),
    );
  }
}
