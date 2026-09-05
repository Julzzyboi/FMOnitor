import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/delivery_task.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// One delivery task in the selected day's list: what it is, where it
/// goes, its scheduled time, and its current status.
class DeliveryTaskCard extends StatelessWidget {
  const DeliveryTaskCard({super.key, required this.task, required this.onTap});

  final DeliveryTask task;
  final VoidCallback onTap;

  String get _timeLabel {
    final hour = task.date.hour % 12 == 0 ? 12 : task.date.hour % 12;
    final minute = task.date.minute.toString().padLeft(2, '0');
    final period = task.date.hour < 12 ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: task.status.background, borderRadius: BorderRadius.circular(12)),
              child: Icon(task.status.icon, size: 20, color: task.status.color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    task.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.montserrat(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13, color: AppColors.textMuted),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          task.destination,
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
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  _timeLabel,
                  style: GoogleFonts.montserrat(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textSubtitle),
                ),
                const SizedBox(height: 6),
                Text(
                  task.status.label,
                  style: GoogleFonts.montserrat(fontSize: 10.5, fontWeight: FontWeight.w700, color: task.status.color),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
