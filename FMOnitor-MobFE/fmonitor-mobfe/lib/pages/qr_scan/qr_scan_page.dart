import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../navigation/bottom_nav_bar.dart';
import '../../theme/app_colors.dart';
import 'widgets/flashlight_button.dart';
import 'widgets/gallery_button.dart';
import 'widgets/request_passcode_button.dart';
import 'widgets/scan_frame.dart';

/// The hauler's QR scan destination. There's no camera plugin wired up yet,
/// so this is the surrounding scanner UI (viewfinder frame, flashlight
/// toggle, and the manual-passcode fallback) rather than a live camera
/// feed - each piece is genuinely functional on its own, just not backed
/// by hardware/a server yet.
class QrScanPage extends StatelessWidget {
  const QrScanPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.waveBlack,
      child: SafeArea(
        bottom: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            const topPadding = 28.0;
            final bottomPadding = AppBottomNavBar.reservedHeight(context) + 16;

            return SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24, topPadding, 24, bottomPadding),
              child: ConstrainedBox(
                // Subtract the padding above - it's already spoken for, so
                // the Spacers below should only fill what's left, not the
                // full viewport height (which pushed content past what's
                // actually visible above the floating nav bar/FAB).
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - topPadding - bottomPadding,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Spacers on both ends center the block, weighted
                      // toward the top so it sits further down than dead
                      // center rather than pinned to the top edge.
                      const Spacer(flex: 3),
                      Text(
                        'Scan QR Code',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.montserrat(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Align the QR code within the frame to scan',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.montserrat(fontSize: 13, color: Colors.white.withValues(alpha: 0.7)),
                      ),
                      const SizedBox(height: 32),
                      const ScanFrame(),
                      const SizedBox(height: 32),
                      const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          FlashlightButton(),
                          SizedBox(width: 32),
                          GalleryButton(),
                        ],
                      ),
                      const SizedBox(height: 28),
                      const RequestPasscodeButton(),
                      const Spacer(flex: 2),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
