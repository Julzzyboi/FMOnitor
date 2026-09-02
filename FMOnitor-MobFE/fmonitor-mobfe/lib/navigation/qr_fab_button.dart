import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../theme/app_colors.dart';
import '../widgets/common/tap_scale.dart';

/// The large yellow QR-scan button that floats above the notch in the
/// bottom bar, matching the design mockup.
class QrFabButton extends StatelessWidget {
  const QrFabButton({super.key, required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TapScale(
      key: const ValueKey('qr_fab'),
      onTap: onTap,
      scale: 0.92,
      child: Container(
        width: 62,
        height: 62,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.yellow,
          border: Border.all(color: AppColors.waveBlack, width: 4),
        ),
        child: const Center(
          child: FaIcon(FontAwesomeIcons.qrcode, size: 24, color: AppColors.waveBlack),
        ),
      ),
    );
  }
}
