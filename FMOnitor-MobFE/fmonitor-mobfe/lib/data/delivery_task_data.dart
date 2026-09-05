import 'delivery_task.dart';

/// Sample delivery assignments standing in for what would come from the
/// admin backend once it exists - dated around the current month so the
/// calendar has something to show without needing to browse elsewhere.
final List<DeliveryTask> kDeliveryTasks = [
  DeliveryTask(
    id: 'del-2026-09-02-chairs',
    date: DateTime(2026, 9, 2, 13, 30),
    title: 'Deliver Stackable Chairs',
    client: 'Qpav Mezzanine Event',
    destination: 'Qpav Mezzanine',
    status: DeliveryStatus.completed,
    itemsSummary: '50x Stackable Chairs (Black)',
  ),
  DeliveryTask(
    id: 'del-2026-09-05-scaffolding',
    date: DateTime(2026, 9, 5, 8, 0),
    title: 'Deliver Scaffolding Set',
    client: 'St. Raymund Facilities',
    destination: 'St. Raymund Back Area',
    status: DeliveryStatus.inTransit,
    itemsSummary: '20x Scaffolding 5ft, 20x Scaffolding 3ft',
    notes: 'Coordinate with the site engineer before unloading.',
  ),
  DeliveryTask(
    id: 'del-2026-09-05-water',
    date: DateTime(2026, 9, 5, 15, 0),
    title: 'Deliver Water Dispenser',
    client: 'Con Van #3 Restock',
    destination: 'Con Van #3',
    status: DeliveryStatus.pending,
    itemsSummary: '4x Water Dispenser',
  ),
  DeliveryTask(
    id: 'del-2026-09-08-backdrop',
    date: DateTime(2026, 9, 8, 10, 0),
    title: 'Deliver Backdrop 12x12',
    client: 'Qpav Event Setup',
    destination: 'Qpav',
    status: DeliveryStatus.pending,
    itemsSummary: '2x Backdrop 12x12',
  ),
  DeliveryTask(
    id: 'del-2026-09-12-lifetime-table',
    date: DateTime(2026, 9, 12, 9, 30),
    title: 'Deliver Lifetime Tables',
    client: 'Scaffolding Storage Restock',
    destination: 'Scaffolding',
    status: DeliveryStatus.pending,
    itemsSummary: '10x Lifetime Table',
  ),
  DeliveryTask(
    id: 'del-2026-09-15-monoblock',
    date: DateTime(2026, 9, 15, 11, 0),
    title: 'Deliver Monoblock Chairs',
    client: 'Bgpop Ground Floor Setup',
    destination: 'Bgpop Ground Floor',
    status: DeliveryStatus.pending,
    itemsSummary: '100x Monoblock Chairs (White)',
  ),
  DeliveryTask(
    id: 'del-2026-09-15-photowall',
    date: DateTime(2026, 9, 15, 14, 0),
    title: 'Deliver Photowall Set',
    client: 'Bgpop Ground Floor Setup',
    destination: 'Bgpop Ground Floor',
    status: DeliveryStatus.pending,
    itemsSummary: '3x Photowall 12x12, 1x Photowall 8x12',
  ),
  DeliveryTask(
    id: 'del-2026-09-20-railings',
    date: DateTime(2026, 9, 20, 14, 0),
    title: 'Deliver Railings',
    client: 'St. Raymund Facilities',
    destination: 'St. Raymund Back Area',
    status: DeliveryStatus.pending,
    itemsSummary: '40x Railings',
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
