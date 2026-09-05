import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

/// One labeled field on a detail page: a small icon tile, a muted label,
/// and the value beneath it. Meant to be separated by [DetailDivider]s.
class DetailRow extends StatelessWidget {
  const DetailRow({super.key, required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: AppColors.surfaceMuted, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: AppColors.textSubtitle),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.montserrat(fontSize: 11.5, color: AppColors.textMuted)),
                const SizedBox(height: 2),
                Text(value, style: GoogleFonts.montserrat(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.textDark)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DetailDivider extends StatelessWidget {
  const DetailDivider({super.key});

  @override
  Widget build(BuildContext context) => const Divider(height: 1, color: AppColors.borderGray);
}
