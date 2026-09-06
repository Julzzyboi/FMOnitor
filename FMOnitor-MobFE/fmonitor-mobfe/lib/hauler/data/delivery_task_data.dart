import 'delivery_task.dart';

/// A single placeholder delivery - the calendar's job right now is to prove
/// out the day-selection/list/detail flow, not to carry a realistic full
/// month of sample data.
final List<DeliveryTask> kDeliveryTasks = [
  DeliveryTask(
    id: 'del-2026-09-06-placeholder',
    date: DateTime(2026, 9, 6, 10, 0),
    title: 'Sample Delivery Task',
    client: 'Placeholder Client',
    destination: 'TBD',
    status: DeliveryStatus.pending,
    itemsSummary: 'TBD',
  ),
];

bool _isSameDate(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

/// Every delivery scheduled on [day], earliest first.
List<DeliveryTask> tasksOnDay(DateTime day) {
  final tasks = kDeliveryTasks.where((task) => _isSameDate(task.date, day)).toList();
  tasks.sort((a, b) => a.date.compareTo(b.date));
  return tasks;
}

bool hasTasksOnDay(DateTime day) => kDeliveryTasks.any((task) => _isSameDate(task.date, day));
