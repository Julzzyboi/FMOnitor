import 'package:flutter/material.dart';
import '../../../data/delivery_task_data.dart';
import 'day_cell.dart';
import 'weekday_header.dart';

bool _isSameDate(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

/// The weekday header plus a single row of days for the week starting at
/// [weekStart] (a Sunday). Used by the Minimal view - the same day cells as
/// [MonthGrid], just one week tall instead of six.
class WeekRow extends StatelessWidget {
  const WeekRow({super.key, required this.weekStart, required this.selectedDay, required this.onSelectDay});

  final DateTime weekStart;
  final DateTime? selectedDay;
  final ValueChanged<DateTime> onSelectDay;

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final days = List.generate(7, (i) => DateTime(weekStart.year, weekStart.month, weekStart.day + i));

    return Column(
      children: [
        const WeekdayHeader(),
        const SizedBox(height: 6),
        Row(
          children: [
            for (final day in days)
              Expanded(
                child: DayCell(
                  key: ValueKey('day_${day.year}-${day.month}-${day.day}'),
                  day: day,
                  inCurrentPeriod: true,
                  isToday: _isSameDate(day, today),
                  isSelected: selectedDay != null && _isSameDate(day, selectedDay!),
                  hasTasks: hasTasksOnDay(day),
                  onTap: () => onSelectDay(day),
                ),
              ),
          ],
        ),
      ],
    );
  }
}
