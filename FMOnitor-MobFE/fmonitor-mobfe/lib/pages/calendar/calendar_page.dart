import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/delivery_task.dart';
import '../../data/delivery_task_data.dart';
import '../../navigation/bottom_nav_bar.dart';
import '../../theme/app_colors.dart';
import '../../widgets/common/blank_loading_page.dart';
import 'delivery_task_detail_page.dart';
import 'widgets/calendar_view_mode.dart';
import 'widgets/delivery_task_card.dart';
import 'widgets/month_grid.dart';
import 'widgets/month_header.dart';
import 'widgets/week_row.dart';

const _monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const _monthAbbrevs = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const _weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const double _detailedGridHeight = 344;
const double _minimalGridHeight = 82;
const _pagerTransition = Duration(milliseconds: 320);

DateTime _startOfWeek(DateTime date) {
  final offset = date.weekday % 7; // Dart: Mon=1..Sun=7 -> Sun=0
  return DateTime(date.year, date.month, date.day - offset);
}

/// The hauler's Calendar tab: a month grid (Detailed) or single week strip
/// (Minimal) - delivery days marked with a dot - and, below it, the list of
/// deliveries assigned by admin for whichever day is selected. Read-only -
/// haulers view what's scheduled, they don't create or edit it here.
class CalendarPage extends StatelessWidget {
  const CalendarPage({super.key});

  @override
  Widget build(BuildContext context) => const BlankLoadingPage(child: _CalendarContent());
}

class _CalendarContent extends StatefulWidget {
  const _CalendarContent();

  @override
  State<_CalendarContent> createState() => _CalendarContentState();
}

class _CalendarContentState extends State<_CalendarContent> {
  final _monthPagerKey = GlobalKey<_DetailedMonthPagerState>();
  final _weekPagerKey = GlobalKey<_MinimalWeekPagerState>();

  CalendarViewMode _viewMode = CalendarViewMode.detailed;
  late DateTime _visibleMonth;
  late DateTime _visibleWeekStart;
  DateTime? _selectedDay;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _visibleMonth = DateTime(now.year, now.month);
    _selectedDay = DateTime(now.year, now.month, now.day);
    _visibleWeekStart = _startOfWeek(_selectedDay!);
  }

  void _goPrev() {
    if (_viewMode == CalendarViewMode.detailed) {
      _monthPagerKey.currentState?.goPrev();
    } else {
      _weekPagerKey.currentState?.goPrev();
    }
  }

  void _goNext() {
    if (_viewMode == CalendarViewMode.detailed) {
      _monthPagerKey.currentState?.goNext();
    } else {
      _weekPagerKey.currentState?.goNext();
    }
  }

  void _toggleViewMode() {
    final mode = _viewMode == CalendarViewMode.detailed ? CalendarViewMode.minimal : CalendarViewMode.detailed;
    final now = DateTime.now();
    setState(() {
      _viewMode = mode;
      _visibleMonth = DateTime(now.year, now.month);
      _visibleWeekStart = _startOfWeek(DateTime(now.year, now.month, now.day));
      _selectedDay = DateTime(now.year, now.month, now.day);
    });
  }

  void _selectDay(DateTime day) => setState(() => _selectedDay = day);

  void _openTaskDetail(DeliveryTask task) {
    // Slides up from the bottom, matching the Inventory detail page.
    Navigator.of(context).push(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 280),
        reverseTransitionDuration: const Duration(milliseconds: 220),
        pageBuilder: (_, _, _) => DeliveryTaskDetailPage(task: task),
        transitionsBuilder: (_, animation, _, child) {
          final curved = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic, reverseCurve: Curves.easeInCubic);
          return SlideTransition(
            position: Tween<Offset>(begin: const Offset(0, 1), end: Offset.zero).animate(curved),
            child: child,
          );
        },
      ),
    );
  }

  String _sectionLabel(DateTime day) => 'DELIVERIES ON ${_monthAbbrevs[day.month - 1].toUpperCase()} ${day.day}';

  String _fullDateLabel(DateTime day) => '${_weekdayNames[day.weekday - 1]}, ${_monthAbbrevs[day.month - 1]} ${day.day}';

  String get _headerLabel {
    if (_viewMode == CalendarViewMode.detailed) {
      return '${_monthNames[_visibleMonth.month - 1]} ${_visibleMonth.year}';
    }
    // A week can straddle two months - show whichever month most of the
    // visible week actually falls in, not the literal day range.
    final midweek = _visibleWeekStart.add(const Duration(days: 3));
    return '${_monthNames[midweek.month - 1]} ${midweek.year}';
  }

  @override
  Widget build(BuildContext context) {
    final selectedDay = _selectedDay;
    final tasks = selectedDay == null ? const <DeliveryTask>[] : tasksOnDay(selectedDay);

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(20, 16, 20, AppBottomNavBar.reservedHeight(context) + 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MonthHeader(
            label: _headerLabel,
            viewMode: _viewMode,
            onPrev: _goPrev,
            onNext: _goNext,
            onToggleView: _toggleViewMode,
          ),
          const SizedBox(height: 16),
          AnimatedSize(
            duration: _pagerTransition,
            curve: Curves.easeInOut,
            alignment: Alignment.topCenter,
            // Each branch declares its own height rather than the switch
            // sharing one forced height across both - during the cross-fade
            // the outgoing (taller) child would otherwise get squeezed into
            // whatever the incoming (shorter) child's box already claimed,
            // overflowing. Sizing bottom-up like this lets AnimatedSize
            // measure and animate off the real natural size at every frame.
            child: ClipRect(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _viewMode == CalendarViewMode.detailed
                    ? SizedBox(
                        key: const ValueKey('detailed'),
                        height: _detailedGridHeight,
                        child: _DetailedMonthPager(
                          key: _monthPagerKey,
                          initialMonth: _visibleMonth,
                          selectedDay: _selectedDay,
                          onSelectDay: _selectDay,
                          onMonthChanged: (month) => setState(() => _visibleMonth = month),
                        ),
                      )
                    : SizedBox(
                        key: const ValueKey('minimal'),
                        height: _minimalGridHeight,
                        child: _MinimalWeekPager(
                          key: _weekPagerKey,
                          initialWeekStart: _visibleWeekStart,
                          selectedDay: _selectedDay,
                          onSelectDay: _selectDay,
                          onWeekChanged: (weekStart) => setState(() => _visibleWeekStart = weekStart),
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          if (selectedDay != null) ...[
            Row(
              children: [
                Text(
                  _sectionLabel(selectedDay),
                  style: GoogleFonts.montserrat(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    color: AppColors.textMuted,
                  ),
                ),
                const Spacer(),
                Text(
                  '${tasks.length} task${tasks.length == 1 ? '' : 's'}',
                  style: GoogleFonts.montserrat(fontSize: 11.5, color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              _fullDateLabel(selectedDay),
              style: GoogleFonts.montserrat(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark),
            ),
            const SizedBox(height: 14),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 220),
              child: KeyedSubtree(
                key: ValueKey('${selectedDay.year}-${selectedDay.month}-${selectedDay.day}'),
                child: tasks.isEmpty
                    ? const _EmptyState()
                    : Column(
                        children: [
                          for (final task in tasks) ...[
                            DeliveryTaskCard(task: task, onTap: () => _openTaskDetail(task)),
                            if (task != tasks.last) const SizedBox(height: 12),
                          ],
                        ],
                      ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Owns its own [PageController] paging through consecutive months for the
/// Detailed view - swiping (or [goPrev]/[goNext], driven by the header's
/// arrow buttons) animates smoothly to the adjacent month.
class _DetailedMonthPager extends StatefulWidget {
  const _DetailedMonthPager({
    super.key,
    required this.initialMonth,
    required this.selectedDay,
    required this.onSelectDay,
    required this.onMonthChanged,
  });

  final DateTime initialMonth;
  final DateTime? selectedDay;
  final ValueChanged<DateTime> onSelectDay;
  final ValueChanged<DateTime> onMonthChanged;

  @override
  State<_DetailedMonthPager> createState() => _DetailedMonthPagerState();
}

class _DetailedMonthPagerState extends State<_DetailedMonthPager> {
  static const _initialPage = 1200;
  late final PageController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: _initialPage);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  DateTime _monthForPage(int page) {
    final delta = page - _initialPage;
    return DateTime(widget.initialMonth.year, widget.initialMonth.month + delta);
  }

  void goPrev() => _controller.previousPage(duration: _pagerTransition, curve: Curves.easeInOut);
  void goNext() => _controller.nextPage(duration: _pagerTransition, curve: Curves.easeInOut);

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: _controller,
      onPageChanged: (page) => widget.onMonthChanged(_monthForPage(page)),
      itemBuilder: (context, page) => MonthGrid(
        visibleMonth: _monthForPage(page),
        selectedDay: widget.selectedDay,
        onSelectDay: widget.onSelectDay,
      ),
    );
  }
}

/// Same idea as [_DetailedMonthPager], but pages through consecutive weeks
/// for the Minimal view.
class _MinimalWeekPager extends StatefulWidget {
  const _MinimalWeekPager({
    super.key,
    required this.initialWeekStart,
    required this.selectedDay,
    required this.onSelectDay,
    required this.onWeekChanged,
  });

  final DateTime initialWeekStart;
  final DateTime? selectedDay;
  final ValueChanged<DateTime> onSelectDay;
  final ValueChanged<DateTime> onWeekChanged;

  @override
  State<_MinimalWeekPager> createState() => _MinimalWeekPagerState();
}

class _MinimalWeekPagerState extends State<_MinimalWeekPager> {
  static const _initialPage = 5000;
  late final PageController _controller;

  @override
  void initState() {
    super.initState();
    _controller = PageController(initialPage: _initialPage);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  DateTime _weekStartForPage(int page) {
    final delta = page - _initialPage;
    return widget.initialWeekStart.add(Duration(days: 7 * delta));
  }

  void goPrev() => _controller.previousPage(duration: _pagerTransition, curve: Curves.easeInOut);
  void goNext() => _controller.nextPage(duration: _pagerTransition, curve: Curves.easeInOut);

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: _controller,
      onPageChanged: (page) => widget.onWeekChanged(_weekStartForPage(page)),
      itemBuilder: (context, page) => WeekRow(
        weekStart: _weekStartForPage(page),
        selectedDay: widget.selectedDay,
        onSelectDay: widget.onSelectDay,
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.borderGray),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(Icons.local_shipping_outlined, size: 36, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text(
            'No deliveries this day',
            style: GoogleFonts.montserrat(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textDark),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              'Deliveries assigned by admin will show up here.',
              textAlign: TextAlign.center,
              style: GoogleFonts.montserrat(fontSize: 12.5, color: AppColors.textMuted),
            ),
          ),
        ],
      ),
    );
  }
}
