import 'package:flutter/material.dart';
import 'package:fmonitor/common/theme/app_colors.dart';

enum TicketStatus { pending, approved, inTransit, delivered, completed }

extension TicketStatusStyle on TicketStatus {
  String get label => switch (this) {
        TicketStatus.pending => 'Pending',
        TicketStatus.approved => 'Approved',
        TicketStatus.inTransit => 'In Transit',
        TicketStatus.delivered => 'Delivered',
        TicketStatus.completed => 'Completed',
      };

  Color get color => switch (this) {
        TicketStatus.pending => AppColors.amber400,
        TicketStatus.approved => AppColors.statusBlue,
        TicketStatus.inTransit => AppColors.statusPurple,
        TicketStatus.delivered => AppColors.statusGreen,
        TicketStatus.completed => AppColors.statusGreen,
      };

  Color get background => switch (this) {
        TicketStatus.pending => AppColors.amber100,
        TicketStatus.approved => AppColors.statusBlueBg,
        TicketStatus.inTransit => AppColors.statusPurpleBg,
        TicketStatus.delivered => AppColors.statusGreenBg,
        TicketStatus.completed => AppColors.statusGreenBg,
      };

  /// Per the test plan: a requestor can only submit an Additional Request
  /// (or an early-retrieval request) once the original ticket has actually
  /// been delivered - never before, so this is what the button's enabled
  /// state is gated on.
  bool get allowsAdditionalRequest => this == TicketStatus.delivered || this == TicketStatus.completed;
}

/// One E-Reserve delivery ticket, from the requestor's side. There's no
/// backend yet - this is sample data standing in for what Admin/Hauler
/// activity would otherwise produce.
class RequestorTicket {
  const RequestorTicket({
    required this.id,
    required this.itemName,
    required this.quantity,
    required this.location,
    required this.scheduledDate,
    required this.status,
    required this.caption,
    this.imageAsset,
  });

  final String id;
  final String itemName;
  final int quantity;
  final String location;
  final DateTime scheduledDate;
  final TicketStatus status;

  /// A short description of the reserved item, shown next to its photo
  /// (e.g. "Industrial Monoblock Seating").
  final String caption;
  final String? imageAsset;
}
