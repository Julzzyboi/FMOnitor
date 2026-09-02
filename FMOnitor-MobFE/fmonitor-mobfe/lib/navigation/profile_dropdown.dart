import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

/// Just a Logout action for now - profile details/settings aren't part of
/// this pass.
class ProfileDropdown extends StatelessWidget {
  const ProfileDropdown({super.key, required this.onLogout});

  final VoidCallback onLogout;

  static const Color _logoutRed = Color(0xFFDC2626);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 176,
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.14),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onLogout,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const FaIcon(
                  FontAwesomeIcons.rightFromBracket,
                  size: 15,
                  color: _logoutRed,
                ),
                const SizedBox(width: 10),
                Text(
                  'Logout',
                  style: GoogleFonts.montserrat(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: _logoutRed,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
