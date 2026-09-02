import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';

class GreetingHeader extends StatelessWidget {
  const GreetingHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Text(
      'Welcome, Yao',
      style: GoogleFonts.montserrat(
        fontSize: 21,
        fontWeight: FontWeight.w700,
        color: AppColors.textDark,
      ),
    );
  }
}
