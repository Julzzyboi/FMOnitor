import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';

/// Free-text search over the equipment name and its storage area.
class InventorySearchBar extends StatelessWidget {
  const InventorySearchBar({super.key, required this.controller, required this.onChanged});

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderGray),
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        style: GoogleFonts.montserrat(fontSize: 13.5, color: AppColors.textDark),
        decoration: InputDecoration(
          isDense: true,
          border: InputBorder.none,
          hintText: 'Search by name or storage area...',
          hintStyle: GoogleFonts.montserrat(fontSize: 13.5, color: AppColors.textMuted),
          prefixIcon: const Icon(Icons.search, size: 20, color: AppColors.textMuted),
          suffixIcon: controller.text.isEmpty
              ? null
              : IconButton(
                  icon: const Icon(Icons.close, size: 18, color: AppColors.textMuted),
                  onPressed: () {
                    controller.clear();
                    onChanged('');
                  },
                ),
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}
