import 'requestor_ticket.dart';

const String _imgDir = 'assets/images/inventory';

/// Sample E-Reserve tickets standing in for what would come from the
/// backend once it exists - active/pending counts land on 3 and 5 to match
/// the reference dashboard mockup.
final List<RequestorTicket> kRequestorTickets = [
  RequestorTicket(
    id: 'TKT-99021',
    itemName: 'Monoblock Chairs',
    quantity: 12,
    location: 'QPAV',
    scheduledDate: DateTime(2026, 10, 28),
    status: TicketStatus.approved,
    caption: 'Industrial Monoblock Seating',
    imageAsset: '$_imgDir/Monoblock Chairs.jpg',
  ),
  RequestorTicket(
    id: 'TKT-99022',
    itemName: 'Stanchions',
    quantity: 20,
    location: 'Qpav Mezzanine',
    scheduledDate: DateTime(2026, 11, 2),
    status: TicketStatus.inTransit,
    caption: 'Crowd Control Stanchions',
    imageAsset: '$_imgDir/Stanchions.jpg',
  ),
  RequestorTicket(
    id: 'TKT-99023',
    itemName: 'Backdrop 12x12',
    quantity: 2,
    location: 'Qpav',
    scheduledDate: DateTime(2026, 11, 5),
    status: TicketStatus.delivered,
    caption: 'Event Stage Backdrop',
    imageAsset: '$_imgDir/Backdrop.jpg',
  ),
  RequestorTicket(
    id: 'TKT-99024',
    itemName: 'Monoblock Chairs',
    quantity: 12,
    location: 'QPAV',
    scheduledDate: DateTime(2026, 10, 29),
    status: TicketStatus.pending,
    caption: 'Industrial Monoblock Seating',
    imageAsset: '$_imgDir/Monoblock Chairs.jpg',
  ),
  RequestorTicket(
    id: 'TKT-99025',
    itemName: 'Lifetime Table',
    quantity: 5,
    location: 'Scaffolding',
    scheduledDate: DateTime(2026, 11, 10),
    status: TicketStatus.pending,
    caption: 'Folding Utility Tables',
    imageAsset: '$_imgDir/Lifetime Table.jpg',
  ),
  RequestorTicket(
    id: 'TKT-99026',
    itemName: 'Railings',
    quantity: 40,
    location: 'St. Raymund Back Area',
    scheduledDate: DateTime(2026, 11, 12),
    status: TicketStatus.pending,
    caption: 'Queue Divider Railings',
    imageAsset: '$_imgDir/Railings.jpg',
  ),
  RequestorTicket(
    id: 'TKT-99027',
    itemName: 'Water Dispenser',
    quantity: 3,
    location: 'Con Van #3',
    scheduledDate: DateTime(2026, 11, 15),
    status: TicketStatus.pending,
    caption: 'Cold/Hot Water Dispenser',
    imageAsset: '$_imgDir/Water Dispenser.jpg',
  ),
  RequestorTicket(
    id: 'TKT-99028',
    itemName: 'Podium (Wooden)',
    quantity: 1,
    location: 'Qpav Mezzanine',
    scheduledDate: DateTime(2026, 11, 18),
    status: TicketStatus.pending,
    caption: 'Wooden Speaker Podium',
    imageAsset: '$_imgDir/Podium (wooden).jpg',
  ),
  RequestorTicket(
    id: 'TKT-99029',
    itemName: 'Scaffolding 5ft',
    quantity: 10,
    location: 'Scaffolding',
    scheduledDate: DateTime(2026, 10, 20),
    status: TicketStatus.completed,
    caption: 'Event Scaffolding Set',
    imageAsset: '$_imgDir/Scaffolding 5FT.jpg',
  ),
];

int get activeTicketCount => kRequestorTickets
    .where((t) => t.status == TicketStatus.approved || t.status == TicketStatus.inTransit || t.status == TicketStatus.delivered)
    .length;

int get pendingTicketCount => kRequestorTickets.where((t) => t.status == TicketStatus.pending).length;
