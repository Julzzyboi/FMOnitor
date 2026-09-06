import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fmonitor/common/theme/app_colors.dart';
import 'package:fmonitor/common/widgets/blank_loading_page.dart';
import '../../data/requestor_ticket_data.dart';
import '../../navigation/requestor_bottom_nav.dart';
import 'widgets/requestor_ticket_card.dart';
import 'widgets/ticket_stat_tile.dart';

/// The requestor's landing page: how many tickets are active/pending, and
/// a short list of their most recent ones. Based on the E-Reserve test
/// plan and the reference dashboard mockup - "Show All" isn't wired up
/// since there's no full ticket list page yet (that's what History will
/// become).
class RequestorHomePage extends StatelessWidget {
  const RequestorHomePage({super.key});

  @override
  Widget build(BuildContext context) => const BlankLoadingPage(child: _RequestorHomeContent());
}

class _RequestorHomeContent extends StatelessWidget {
  const _RequestorHomeContent();

  @override
  Widget build(BuildContext context) {
    final recentTickets = kRequestorTickets.take(3).toList();

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(20, 20, 20, RequestorBottomNav.reservedHeight(context) + 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome, Requestor',
            style: GoogleFonts.montserrat(fontSize: 21, fontWeight: FontWeight.w700, color: AppColors.textDark),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              TicketStatTile(
                label: 'Active Tickets',
                count: activeTicketCount,
                background: AppColors.amber100,
                foreground: AppColors.amber400,
              ),
              const SizedBox(width: 12),
              TicketStatTile(
                label: 'Pending Tickets',
                count: pendingTicketCount,
                background: AppColors.surfaceMuted,
                foreground: AppColors.textMuted,
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                'RECENT TICKETS',
                style: GoogleFonts.montserrat(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                  color: AppColors.textMuted,
                ),
              ),
              const Spacer(),
              GestureDetector(
                // Not wired up yet - no full ticket list page exists.
                onTap: () {},
                child: Text(
                  'Show All',
                  style: GoogleFonts.montserrat(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.amber400),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            children: [
              for (final ticket in recentTickets) ...[
                RequestorTicketCard(ticket: ticket),
                if (ticket != recentTickets.last) const SizedBox(height: 12),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
