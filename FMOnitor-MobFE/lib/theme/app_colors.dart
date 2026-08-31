import 'package:flutter/material.dart';

/// Colors sampled directly from the web app's login page (FMOnitor-WebFE)
/// so both platforms stay visually identical.
class AppColors {
  AppColors._();

  static const Color yellow = Color(0xFFFDCC36);
  static const Color amber400 = Color(0xFFFBBF24);
  static const Color amber100 = Color(0xFFFEF3C7);
  static const Color waveBlack = Color(0xFF111112);
  static const Color waveGray = Color(0xFF2E2E30);
  static const Color waveBorder = Color(0xFFF7A823);

  static const Color textDark = Color(0xFF111827); // gray-900
  static const Color textSubtitle = Color(0xFF374151); // gray-700
  static const Color textMuted = Color(0xFF6B7280); // gray-500
  static const Color textBody = Color(0xFF374151); // gray-700 (google button label)
  static const Color borderGray = Color(0xFFE5E7EB); // gray-200

  // Terms text sits inside the gray wave band now, so it needs light colors.
  static const Color textOnWave = Color(0xFFE5E7EB); // gray-200
}
