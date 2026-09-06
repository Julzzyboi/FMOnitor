import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fmonitor/common/theme/app_colors.dart';
import '../../../data/requestor_ticket.dart';

const _monthAbbrevs = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

/// One delivery ticket on the requestor's dashboard: what it is, where and
/// when it's scheduled, and the Additional Request action - which the test
/// plan only allows once the ticket has actually been Delivered.
class RequestorTicketCard extends StatelessWidget {
  const RequestorTicketCard({super.key, required this.ticket});

  final RequestorTicket ticket;

  String get _dateLabel =>
      '${_monthAbbrevs[ticket.scheduledDate.month - 1]} ${ticket.scheduledDate.day}, ${ticket.scheduledDate.year}';

  @override
  Widget build(BuildContext context) {
    final canRequest = ticket.status.allowsAdditionalRequest;

    return Container(
      key: ValueKey('ticket_${ticket.id}'),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderGray),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  ticket.itemName,
                  style: GoogleFonts.montserrat(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: ticket.status.background, borderRadius: BorderRadius.circular(999)),
                child: Text(
                  ticket.status.label,
                  style: GoogleFonts.montserrat(fontSize: 10.5, fontWeight: FontWeight.w700, color: ticket.status.color),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _MiniField(icon: Icons.inventory_2_outlined, label: 'QUANTITY', value: '${ticket.quantity} UNITS'),
              _MiniField(icon: Icons.location_on_outlined, label: 'LOCATION', value: ticket.location),
              _MiniField(icon: Icons.event_outlined, label: 'SCHEDULED FOR', value: _dateLabel),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: SizedBox(
                  width: 48,
                  height: 48,
                  child: ticket.imageAsset == null
                      ? ColoredBox(
                          color: AppColors.surfaceMuted,
                          child: Icon(Icons.image_outlined, size: 20, color: AppColors.textMuted.withValues(alpha: 0.6)),
                        )
                      : Image.asset(
                          ticket.imageAsset!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => ColoredBox(
                            color: AppColors.surfaceMuted,
                            child: Icon(Icons.image_outlined, size: 20, color: AppColors.textMuted.withValues(alpha: 0.6)),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  ticket.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.montserrat(fontSize: 12.5, color: AppColors.textSubtitle),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              // Marks the shape of the action, not the behavior yet - there's
              // no backend to actually submit a request against.
              onPressed: canRequest ? () {} : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: canRequest ? AppColors.yellow : AppColors.surfaceMuted,
                foregroundColor: canRequest ? AppColors.waveBlack : AppColors.textMuted,
                disabledBackgroundColor: AppColors.surfaceMuted,
                disabledForegroundColor: AppColors.textMuted,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.note_add_outlined, size: 17),
                  const SizedBox(width: 8),
                  Text(
                    'ADDITIONAL REQUEST',
                    style: GoogleFonts.montserrat(fontSize: 12.5, fontWeight: FontWeight.w700, letterSpacing: 0.3),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniField extends StatelessWidget {
  const _MiniField({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: AppColors.textMuted),
              const SizedBox(width: 3),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.montserrat(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.montserrat(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.textDark),
          ),
        ],
      ),
    );
  }
}
