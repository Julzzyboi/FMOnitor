import 'package:flutter/material.dart';
import '../../../data/delivery_task_data.dart';
import 'day_cell.dart';
import 'weekday_header.dart';

bool _isSameDate(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

/// The weekday header plus the 6x7 day grid for [visibleMonth], including
/// the muted leading/trailing days from adjacent months needed to fill out
/// full weeks. Used by the Detailed view.
class MonthGrid extends StatelessWidget {
  const MonthGrid({super.key, required this.visibleMonth, required this.selectedDay, required this.onSelectDay});

  final DateTime visibleMonth;
  final DateTime? selectedDay;
  final ValueChanged<DateTime> onSelectDay;

  List<DateTime> _buildDays() {
    final firstOfMonth = DateTime(visibleMonth.year, visibleMonth.month, 1);
    final leadingDays = firstOfMonth.weekday % 7; // Dart: Mon=1..Sun=7 -> Sun=0
    final gridStart = firstOfMonth.subtract(Duration(days: leadingDays));
    return List.generate(42, (i) => DateTime(gridStart.year, gridStart.month, gridStart.day + i));
  }

  @override
  Widget build(BuildContext context) {
    final days = _buildDays();
    final today = DateTime.now();

    return Column(
      children: [
        const WeekdayHeader(),
        const SizedBox(height: 6),
        for (int row = 0; row < 6; row++)
          Padding(
            padding: EdgeInsets.only(top: row == 0 ? 0 : 4),
            child: Row(
              children: [
                for (int col = 0; col < 7; col++)
                  Expanded(
                    child: Builder(
                      builder: (context) {
                        final day = days[row * 7 + col];
                        return DayCell(
                          key: ValueKey('day_${day.year}-${day.month}-${day.day}'),
                          day: day,
                          inCurrentPeriod: day.month == visibleMonth.month,
                          isToday: _isSameDate(day, today),
                          isSelected: selectedDay != null && _isSameDate(day, selectedDay!),
                          hasTasks: hasTasksOnDay(day),
                          onTap: () => onSelectDay(day),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
