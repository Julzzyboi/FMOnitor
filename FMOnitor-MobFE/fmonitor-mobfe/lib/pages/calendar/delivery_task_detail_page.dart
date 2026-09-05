import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/delivery_task.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common/detail_pill.dart';
import '../../widgets/common/detail_row.dart';

const _monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/// The full-detail view for one delivery assignment - what it is, where
/// it's going, when it's due, and what to bring, laid out larger than the
/// list card rather than adding new information.
class DeliveryTaskDetailPage extends StatelessWidget {
  const DeliveryTaskDetailPage({super.key, required this.task});

  final DeliveryTask task;

  String get _scheduledLabel {
    final hour = task.date.hour % 12 == 0 ? 12 : task.date.hour % 12;
    final minute = task.date.minute.toString().padLeft(2, '0');
    final period = task.date.hour < 12 ? 'AM' : 'PM';
    return '${_monthNames[task.date.month - 1]} ${task.date.day}, ${task.date.year} · $hour:$minute $period';
  }

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
          'Delivery Details',
          style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(color: task.status.background, borderRadius: BorderRadius.circular(18)),
                child: Icon(task.status.icon, size: 30, color: task.status.color),
              ),
              const SizedBox(height: 18),
              Text(
                task.title,
                style: GoogleFonts.montserrat(fontSize: 21, fontWeight: FontWeight.w700, color: AppColors.textDark),
              ),
              const SizedBox(height: 6),
              Text(
                task.client,
                style: GoogleFonts.montserrat(fontSize: 13.5, color: AppColors.textMuted),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  DetailPill(
                    icon: task.status.icon,
                    label: task.status.label,
                    background: task.status.background,
                    foreground: task.status.color,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              const DetailDivider(),
              DetailRow(icon: Icons.schedule, label: 'Scheduled', value: _scheduledLabel),
              const DetailDivider(),
              DetailRow(icon: Icons.location_on_outlined, label: 'Destination', value: task.destination),
              const DetailDivider(),
              DetailRow(icon: Icons.inventory_2_outlined, label: 'Items', value: task.itemsSummary),
              const DetailDivider(),
              if (task.notes != null) ...[
                const SizedBox(height: 20),
                Text(
                  'NOTES',
                  style: GoogleFonts.montserrat(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  task.notes!,
                  style: GoogleFonts.montserrat(fontSize: 13.5, color: AppColors.textSubtitle, height: 1.5),
                ),
              ],
            ],
          ),
        ),
      ),
      bottomNavigationBar: task.status == DeliveryStatus.completed
          ? null
          : SafeArea(
              minimum: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  // Marks the shape of the action, not the behavior yet -
                  // there's no backend to actually update task status.
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.yellow,
                    foregroundColor: AppColors.waveBlack,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle_outline, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Complete Task',
                        style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
