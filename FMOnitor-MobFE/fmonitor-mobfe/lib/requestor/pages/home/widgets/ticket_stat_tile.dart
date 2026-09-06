import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fmonitor/common/theme/app_colors.dart';

/// One of the two summary tiles at the top of the requestor dashboard
/// ("Active Tickets" / "Pending Tickets"), matching the reference mockup's
/// pale, color-coded stat cards.
class TicketStatTile extends StatelessWidget {
  const TicketStatTile({
    super.key,
    required this.label,
    required this.count,
    required this.background,
    required this.foreground,
  });

  final String label;
  final int count;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(16)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label.toUpperCase(),
              style: GoogleFonts.montserrat(fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: 0.4, color: foreground),
            ),
            const SizedBox(height: 8),
            Text(
              '$count',
              style: GoogleFonts.montserrat(fontSize: 26, fontWeight: FontWeight.w700, color: AppColors.textDark),
            ),
          ],
        ),
      ),
    );
  }
}
