import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/common/tap_scale.dart';

/// Lets the hauler pick an existing QR code image from their photo gallery
/// instead of scanning live - genuinely opens the system picker; there's
/// just no QR decoder wired up yet to read whatever image comes back.
class GalleryButton extends StatefulWidget {
  const GalleryButton({super.key});

  @override
  State<GalleryButton> createState() => _GalleryButtonState();
}

class _GalleryButtonState extends State<GalleryButton> {
  bool _picking = false;
  bool _hasImage = false;

  Future<void> _pick() async {
    if (_picking) return;
    setState(() => _picking = true);
    XFile? file;
    try {
      file = await ImagePicker().pickImage(source: ImageSource.gallery);
    } finally {
      if (mounted) {
        setState(() {
          _picking = false;
          if (file != null) _hasImage = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _hasImage ? AppColors.waveBlack : Colors.white;
    final background = _hasImage ? AppColors.yellow : Colors.white.withValues(alpha: 0.14);

    return TapScale(
      onTap: _pick,
      scale: 0.9,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: 44,
            height: 44,
            decoration: BoxDecoration(shape: BoxShape.circle, color: background),
            child: _picking
                ? const Padding(
                    padding: EdgeInsets.all(13),
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Icon(
                    _hasImage ? Icons.check_rounded : Icons.photo_library_rounded,
                    color: color,
                    size: 20,
                  ),
          ),
          const SizedBox(height: 8),
          Text(
            'Gallery',
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
