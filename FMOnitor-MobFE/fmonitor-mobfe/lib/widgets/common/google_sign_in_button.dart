import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import 'google_icon.dart';

/// Clean, modern white pill button with a soft shadow, a subtle hairline
/// border, and a tactile press-scale animation.
class GoogleSignInButton extends StatefulWidget {
  const GoogleSignInButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  State<GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends State<GoogleSignInButton> {
  bool _pressed = false;

  void _setPressed(bool value) => setState(() => _pressed = value);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _setPressed(true),
      onTapUp: (_) => _setPressed(false),
      onTapCancel: () => _setPressed(false),
      onTap: widget.onPressed,
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 120),
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: const Color(0xFFECECEC)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: _pressed ? 0.06 : 0.12),
                blurRadius: _pressed ? 10 : 18,
                offset: Offset(0, _pressed ? 3 : 8),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const GoogleIcon(size: 20),
              const SizedBox(width: 12),
              Text(
                'Sign in with Google',
                style: GoogleFonts.montserrat(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textBody,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
