import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import '../widgets/common/tap_scale.dart';
import 'anchored_dropdown.dart';
import 'notification_dropdown.dart';
import 'profile_dropdown.dart';

/// The persistent header shown on every nav destination: the current page
/// title, a notification bell, and a profile menu.
class AppTopBar extends StatefulWidget implements PreferredSizeWidget {
  const AppTopBar({super.key, required this.title, required this.onLogout});

  final String title;
  final VoidCallback onLogout;

  @override
  Size get preferredSize => const Size.fromHeight(64);

  @override
  State<AppTopBar> createState() => _AppTopBarState();
}

class _AppTopBarState extends State<AppTopBar> with TickerProviderStateMixin {
  final LayerLink _bellLink = LayerLink();
  final LayerLink _profileLink = LayerLink();
  final AnchoredDropdownController _bellDropdown = AnchoredDropdownController();
  final AnchoredDropdownController _profileDropdown = AnchoredDropdownController();

  @override
  void dispose() {
    _bellDropdown.dispose();
    _profileDropdown.dispose();
    super.dispose();
  }

  void _toggleBell() {
    _profileDropdown.close();
    _bellDropdown.toggle(
      context: context,
      link: _bellLink,
      vsync: this,
      builder: (_) => const NotificationDropdown(),
    );
  }

  void _toggleProfile() {
    _bellDropdown.close();
    _profileDropdown.toggle(
      context: context,
      link: _profileLink,
      vsync: this,
      builder: (_) => ProfileDropdown(onLogout: widget.onLogout),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 0,
      child: SafeArea(
        bottom: false,
        child: Container(
          height: widget.preferredSize.height,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: AppColors.borderGray, width: 1),
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Centered independently of the icon row, so it stays
              // dead-center regardless of how wide the icons on the right are.
              KeyedSubtree(
                key: const Key('topbar_title'),
                child: Text(
                  widget.title,
                  style: GoogleFonts.montserrat(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CompositedTransformTarget(
                      link: _bellLink,
                      child: _TopbarIconButton(
                        icon: FontAwesomeIcons.bell,
                        onTap: _toggleBell,
                      ),
                    ),
                    const SizedBox(width: 10),
                    CompositedTransformTarget(
                      link: _profileLink,
                      child: _TopbarIconButton(
                        key: const ValueKey('profile_button'),
                        icon: FontAwesomeIcons.user,
                        circle: true,
                        onTap: _toggleProfile,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopbarIconButton extends StatelessWidget {
  const _TopbarIconButton({
    super.key,
    required this.icon,
    required this.onTap,
    this.circle = false,
  });

  final FaIconData icon;
  final VoidCallback onTap;
  final bool circle;

  @override
  Widget build(BuildContext context) {
    return TapScale(
      onTap: onTap,
      scale: 0.88,
      child: Container(
        width: circle ? 30 : 32,
        height: circle ? 30 : 32,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: circle ? Border.all(color: AppColors.textDark, width: 1.2) : null,
        ),
        child: FaIcon(icon, size: circle ? 12 : 18, color: AppColors.textDark),
      ),
    );
  }
}
