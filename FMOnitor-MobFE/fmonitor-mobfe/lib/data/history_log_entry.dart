import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// The categories a log entry can fall under - what the History filter
/// narrows by.
enum HistoryLogType { delivery, login, system }

extension HistoryLogTypeStyle on HistoryLogType {
  String get label => switch (this) {
        HistoryLogType.delivery => 'Deliveries',
        HistoryLogType.login => 'Login Activity',
        HistoryLogType.system => 'System Updates',
      };

  IconData get icon => switch (this) {
        HistoryLogType.delivery => Icons.local_shipping_outlined,
        HistoryLogType.login => Icons.login,
        HistoryLogType.system => Icons.settings_outlined,
      };

  Color get color => switch (this) {
        HistoryLogType.delivery => AppColors.statusBlue,
        HistoryLogType.login => AppColors.statusGreen,
        HistoryLogType.system => AppColors.statusPurple,
      };

  Color get background => switch (this) {
        HistoryLogType.delivery => AppColors.statusBlueBg,
        HistoryLogType.login => AppColors.statusGreenBg,
        HistoryLogType.system => AppColors.statusPurpleBg,
      };
}

/// One row in the hauler's activity log. There's no backend to pull real
/// log text/timestamps from yet - only [type] is real, everything else is
/// rendered as a placeholder shape on the card.
class HistoryLogEntry {
  const HistoryLogEntry({required this.id, required this.type});

  final String id;
  final HistoryLogType type;
}
