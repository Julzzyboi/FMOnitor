import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// Shared "not wired up yet" feedback for any placeholder button/link -
/// e.g. the login page's Privacy Policy/Terms links, or Home's ticket
/// buttons. One helper instead of duplicating the same SnackBar everywhere.
void showComingSoon(BuildContext context, String label) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text('$label — coming soon'),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.waveGray,
        duration: const Duration(seconds: 2),
      ),
    );
}
