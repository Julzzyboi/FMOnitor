import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// A real on/off toggle (no camera hardware wired up yet, but the state
/// itself is genuine, not a placeholder).
class FlashlightButton extends StatefulWidget {
  const FlashlightButton({super.key});

  @override
  State<FlashlightButton> createState() => _FlashlightButtonState();
}

class _FlashlightButtonState extends State<FlashlightButton> {
  bool _on = false;

  @override
  Widget build(BuildContext context) {
    return TapScale(
      onTap: () => setState(() => _on = !_on),
      scale: 0.9,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: _on ? AppColors.yellow : Colors.white.withValues(alpha: 0.14),
            ),
            child: Icon(
              _on ? Icons.flashlight_on_rounded : Icons.flashlight_off_rounded,
              color: _on ? AppColors.waveBlack : Colors.white,
              size: 20,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Flashlight',
            style: GoogleFonts.montserrat(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: Colors.white.withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }
}
