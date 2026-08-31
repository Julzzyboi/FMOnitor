import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../widgets/dot_grid.dart';
import '../widgets/google_sign_in_button.dart';
import '../widgets/wave_footer.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  late final Animation<double> _bgOpacity;
  late final Animation<double> _waveOpacity;
  late final Animation<double> _logo;
  late final Animation<double> _titleBlock;
  late final Animation<double> _button;
  late final Animation<double> _terms;

  late final TapGestureRecognizer _privacyTap;
  late final TapGestureRecognizer _termsTap;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))
      ..forward();

    _bgOpacity = CurvedAnimation(parent: _controller, curve: const Interval(0.0, 1.0, curve: Curves.easeOut));
    _waveOpacity = CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.6, curve: Curves.easeOut));
    _logo = CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack));
    _titleBlock = CurvedAnimation(parent: _controller, curve: const Interval(0.2, 0.8, curve: Curves.easeOut));
    _button = CurvedAnimation(parent: _controller, curve: const Interval(0.35, 0.95, curve: Curves.easeOut));
    _terms = CurvedAnimation(parent: _controller, curve: const Interval(0.45, 1.0, curve: Curves.easeOut));

    _privacyTap = TapGestureRecognizer()..onTap = () => _showComingSoon('Privacy Policy');
    _termsTap = TapGestureRecognizer()..onTap = () => _showComingSoon('Terms and Conditions');
  }

  @override
  void dispose() {
    _controller.dispose();
    _privacyTap.dispose();
    _termsTap.dispose();
    super.dispose();
  }

  void _showComingSoon(String label) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text('$label — coming soon'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: AppColors.waveGray,
          duration: const Duration(seconds: 2),
        ),
      );
  }

  Widget _fadeSlideIn(Animation<double> animation, Widget child) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, _) {
        return Opacity(
          opacity: animation.value.clamp(0.0, 1.0),
          child: Transform.translate(
            offset: Offset(0, (1 - animation.value.clamp(0.0, 1.0)) * 20),
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  void _handleGoogleSignIn() {
    // TODO: wire up real Google sign-in once the mobile auth flow is decided
    // (e.g. google_sign_in package hitting the same backend as the web app).
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final viewPadding = MediaQuery.of(context).padding;
    final isSmallScreen = size.width < 360;

    // The building sits low, confined to the bottom portion of the screen -
    // not a full-bleed background - and the wave band (drawn on top of it in
    // the stack) covers the lower slice of it, so only the upper part of the
    // building peeks out above the wave.
    final buildingHeight = size.height * 0.44;
    final waveTotalHeight = size.height * 0.30 + viewPadding.bottom;
    final waveCurveHeight = isSmallScreen ? 84.0 : 112.0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SizedBox.expand(
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Building, lower portion of the screen only.
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: buildingHeight,
              child: AnimatedBuilder(
                animation: _bgOpacity,
                builder: (context, _) {
                  return Opacity(
                    opacity: _bgOpacity.value * 0.4,
                    child: Image.asset(
                      'assets/images/building_bg.png',
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                    ),
                  );
                },
              ),
            ),

            // Dot grid, top-left.
            Positioned(
              top: viewPadding.top + 24,
              left: 24,
              child: Opacity(opacity: 0.9, child: const DotGrid()),
            ),

            // Wave band - tall enough to hold the button + terms text.
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: AnimatedBuilder(
                animation: _waveOpacity,
                builder: (context, _) {
                  return Opacity(
                    opacity: _waveOpacity.value,
                    child: WaveFooter(
                      totalHeight: waveTotalHeight,
                      curveHeight: waveCurveHeight,
                    ),
                  );
                },
              ),
            ),

            // Logo + title block, roughly centered in the white space above
            // the building/wave.
            Positioned(
              top: viewPadding.top + size.height * 0.17,
              left: 24,
              right: 24,
              child: Column(
                children: [
                  AnimatedBuilder(
                    animation: _logo,
                    builder: (context, child) {
                      final value = _logo.value.clamp(0.0, 1.0);
                      return Opacity(
                        opacity: value,
                        child: Transform.scale(scale: 0.7 + value * 0.3, child: child),
                      );
                    },
                    child: Image.asset(
                      'assets/images/logo.png',
                      width: isSmallScreen ? 132 : 152,
                      height: isSmallScreen ? 132 : 152,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _fadeSlideIn(
                    _titleBlock,
                    Column(
                      children: [
                        RichText(
                          textAlign: TextAlign.center,
                          text: TextSpan(
                            style: GoogleFonts.montserrat(
                              fontSize: isSmallScreen ? 34 : 40,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.5,
                            ),
                            children: const [
                              TextSpan(text: 'FMO', style: TextStyle(color: AppColors.yellow)),
                              TextSpan(text: 'nitor', style: TextStyle(color: AppColors.textDark)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'FACILITIES MANAGEMENT OFFICE',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.montserrat(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 3,
                            color: AppColors.textSubtitle,
                          ),
                        ),
                        const SizedBox(height: 20),
                        Container(
                          width: 48,
                          height: 4,
                          decoration: BoxDecoration(
                            color: AppColors.yellow,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Google button + terms - live inside the wave band, near the
            // bottom of the screen.
            Positioned(
              left: 24,
              right: 24,
              bottom: viewPadding.bottom + (isSmallScreen ? 30 : 38),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _fadeSlideIn(
                    _button,
                    GoogleSignInButton(onPressed: _handleGoogleSignIn),
                  ),
                  const SizedBox(height: 20),
                  _fadeSlideIn(
                    _terms,
                    RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: GoogleFonts.montserrat(
                          fontSize: 13,
                          height: 1.6,
                          color: AppColors.textOnWave,
                        ),
                        children: [
                          const TextSpan(text: 'By signing in, you agree to our '),
                          TextSpan(
                            text: 'Privacy Policy',
                            recognizer: _privacyTap,
                            style: const TextStyle(color: AppColors.yellow, fontWeight: FontWeight.w600),
                          ),
                          const TextSpan(text: ' and '),
                          TextSpan(
                            text: 'Terms and Conditions',
                            recognizer: _termsTap,
                            style: const TextStyle(color: AppColors.yellow, fontWeight: FontWeight.w600),
                          ),
                          const TextSpan(text: '.'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
