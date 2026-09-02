import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../theme/app_colors.dart';

/// The manual-passcode fallback button. It's inert for now - tapping it
/// does nothing - until the passcode flow is actually wired up.
class RequestPasscodeButton extends StatelessWidget {
  const RequestPasscodeButton({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 210,
      height: 46,
      child: ElevatedButton(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.yellow,
          foregroundColor: AppColors.waveBlack,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
        ),
        // FittedBox guards against overflow at this narrower width - the
        // row scales down to fit rather than clipping, regardless of exact
        // font-metric differences across renderers.
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lock_rounded, size: 18),
              const SizedBox(width: 6),
              Text(
                'Request Passcode',
                style: GoogleFonts.montserrat(fontSize: 14, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
