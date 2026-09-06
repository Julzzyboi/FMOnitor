import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fmonitor/common/theme/app_colors.dart';
import 'package:fmonitor/common/widgets/blank_loading_page.dart';

/// The requestor's History tab - a placeholder for now. This is where
/// past/completed tickets (test plan: "View Order History") will
/// eventually live once that flow is built out.
class RequestorHistoryPage extends StatelessWidget {
  const RequestorHistoryPage({super.key});

  @override
  Widget build(BuildContext context) => const BlankLoadingPage(child: _Placeholder());
}

class _Placeholder extends StatelessWidget {
  const _Placeholder();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.history, size: 40, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(
              'Order History',
              style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark),
            ),
            const SizedBox(height: 6),
            Text(
              'Coming soon.',
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(fontSize: 12.5, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
