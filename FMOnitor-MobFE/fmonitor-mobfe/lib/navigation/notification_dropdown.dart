import 'package:flutter/material.dart';
import '../widgets/common/skeleton_loader.dart';

/// No notification data is wired up yet, so this shows placeholder rows in
/// the app's standard skeleton style rather than a spinner.
class NotificationDropdown extends StatelessWidget {
  const NotificationDropdown({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.14),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: SkeletonPulse(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            return Padding(
              padding: EdgeInsets.only(bottom: i == 2 ? 0 : 14),
              child: Row(
                children: [
                  const SkeletonBox(width: 36, height: 36, borderRadius: 18),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SkeletonBox(width: double.infinity, height: 10),
                        const SizedBox(height: 6),
                        SkeletonBox(width: 70 + (i * 20).toDouble(), height: 9),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }
}
