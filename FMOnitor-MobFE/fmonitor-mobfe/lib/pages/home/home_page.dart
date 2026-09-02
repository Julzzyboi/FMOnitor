import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../navigation/bottom_nav_bar.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common/blank_loading_page.dart';
import '../../widgets/common/skeleton_loader.dart';
import 'widgets/active_haul_card.dart';
import 'widgets/availability_card.dart';
import 'widgets/greeting_header.dart';
import 'widgets/todays_overview.dart';
import 'widgets/upcoming_assignments.dart';

/// The hauler's landing page - just the layout of what they'll eventually
/// see (assigned/active hauls, quick stats), with placeholder bars standing
/// in for real data until the backend is wired up. Only the greeting and
/// the section/category labels are real text - everything else is shape
/// only.
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const BlankLoadingPage(child: _HomeContent());
  }
}

class _HomeContent extends StatelessWidget {
  const _HomeContent();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      // Bottom padding clears the floating nav bar (extendBody:true means
      // it overlaps page content) plus a little breathing room, so the
      // last section can actually be scrolled fully into view above it.
      padding: EdgeInsets.fromLTRB(20, 20, 20, AppBottomNavBar.reservedHeight(context) + 16),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GreetingHeader(),
          SizedBox(height: 20),
          AvailabilityCard(),
          SizedBox(height: 24),
          _SectionHeader(title: 'ACTIVE HAUL', showBadge: true),
          SizedBox(height: 10),
          ActiveHaulCard(),
          SizedBox(height: 24),
          _SectionHeader(title: "TODAY'S OVERVIEW"),
          SizedBox(height: 10),
          TodaysOverview(),
          SizedBox(height: 24),
          _SectionHeader(title: 'UPCOMING ASSIGNMENTS'),
          SizedBox(height: 10),
          UpcomingAssignments(),
        ],
      ),
    );
  }
}

/// A category label, plus an optional status shape and a bare chevron -
/// just the shape of a "see more" affordance, no action wired up yet.
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.showBadge = false});

  final String title;
  final bool showBadge;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          title,
          style: GoogleFonts.montserrat(
            fontSize: 11.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.6,
            color: AppColors.textMuted,
          ),
        ),
        if (showBadge) ...[
          const SizedBox(width: 8),
          const SkeletonBox(width: 64, height: 18, borderRadius: 999),
        ],
        const Spacer(),
        const Icon(Icons.chevron_right, size: 18, color: AppColors.amber400),
      ],
    );
  }
}
