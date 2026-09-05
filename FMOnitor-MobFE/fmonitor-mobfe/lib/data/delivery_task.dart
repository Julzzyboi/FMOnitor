import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum DeliveryStatus { pending, inTransit, completed }

extension DeliveryStatusStyle on DeliveryStatus {
  String get label => switch (this) {
        DeliveryStatus.pending => 'Pending',
        DeliveryStatus.inTransit => 'In Transit',
        DeliveryStatus.completed => 'Completed',
      };

  // Every status shares the same time/clock icon - the colored background
  // is what actually distinguishes pending/in-transit/completed at a
  // glance, since each status is shown alone on its own card, never
  // side-by-side with the others.
  IconData get icon => Icons.access_time_rounded;

  Color get color => switch (this) {
        DeliveryStatus.pending => AppColors.amber400,
        DeliveryStatus.inTransit => AppColors.statusBlue,
        DeliveryStatus.completed => AppColors.statusGreen,
      };

  Color get background => switch (this) {
        DeliveryStatus.pending => AppColors.amber100,
        DeliveryStatus.inTransit => AppColors.statusBlueBg,
        DeliveryStatus.completed => AppColors.statusGreenBg,
      };
}

/// One delivery assignment handed down by an admin - what the hauler's
/// Calendar page exists to surface. There's no backend yet, so haulers
/// can view these but not create or edit them.
class DeliveryTask {
  const DeliveryTask({
    required this.id,
    required this.date,
    required this.title,
    required this.client,
    required this.destination,
    required this.status,
    required this.itemsSummary,
    this.notes,
  });

  final String id;
  final DateTime date;
  final String title;
  final String client;
  final String destination;
  final DeliveryStatus status;
  final String itemsSummary;
  final String? notes;
}
