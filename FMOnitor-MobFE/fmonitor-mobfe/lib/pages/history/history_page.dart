import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/history_log_data.dart';
import '../../data/history_log_entry.dart';
import '../../navigation/bottom_nav_bar.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common/blank_loading_page.dart';
import 'widgets/history_filter_button.dart';
import 'widgets/history_filter_sheet.dart';
import 'widgets/history_log_card.dart';

/// The hauler's History tab: every logged activity, filterable by type.
/// The log entries themselves are placeholders - there's no backend to
/// pull real activity text/timestamps from yet - but the filter is fully
/// functional over the sample data's real [HistoryLogType]s.
class HistoryPage extends StatelessWidget {
  const HistoryPage({super.key});

  @override
  Widget build(BuildContext context) => const BlankLoadingPage(child: _HistoryContent());
}

class _HistoryContent extends StatefulWidget {
  const _HistoryContent();

  @override
  State<_HistoryContent> createState() => _HistoryContentState();
}

class _HistoryContentState extends State<_HistoryContent> {
  HistoryLogType? _selectedType;

  List<HistoryLogEntry> get _filteredEntries => _selectedType == null
      ? kHistoryLogEntries
      : kHistoryLogEntries.where((entry) => entry.type == _selectedType).toList();

  void _openFilterSheet() {
    showHistoryFilterSheet(
      context: context,
      selected: _selectedType,
      onSelect: (type) => setState(() => _selectedType = type),
    );
  }

  @override
  Widget build(BuildContext context) {
    final entries = _filteredEntries;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: HistoryFilterButton(
                  selected: _selectedType,
                  onTap: _openFilterSheet,
                  onClear: () => setState(() => _selectedType = null),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Text(
                    'ACTIVITY LOG',
                    style: GoogleFonts.montserrat(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${entries.length} log${entries.length == 1 ? '' : 's'}',
                    style: GoogleFonts.montserrat(fontSize: 11.5, color: AppColors.textMuted),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: entries.isEmpty
              ? const _EmptyState()
              : ListView.separated(
                  padding: EdgeInsets.fromLTRB(20, 0, 20, AppBottomNavBar.reservedHeight(context) + 16),
                  itemCount: entries.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => HistoryLogCard(entry: entries[index], index: index),
                ),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.history, size: 40, color: AppColors.textMuted),
            const SizedBox(height: 12),
            Text(
              'No activity found',
              style: GoogleFonts.montserrat(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark),
            ),
            const SizedBox(height: 6),
            Text(
              'Try a different filter.',
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(fontSize: 12.5, color: AppColors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
