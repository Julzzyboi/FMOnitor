import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// A small icon+label pill for a detail page's status line (e.g.
/// "Borrowable", "Pending") - a colored background/foreground pairing.
class DetailPill extends StatelessWidget {
  const DetailPill({super.key, required this.icon, required this.label, required this.background, required this.foreground});

  final IconData icon;
  final String label;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: foreground),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.montserrat(fontSize: 12, fontWeight: FontWeight.w700, color: foreground)),
        ],
      ),
    );
  }
}
