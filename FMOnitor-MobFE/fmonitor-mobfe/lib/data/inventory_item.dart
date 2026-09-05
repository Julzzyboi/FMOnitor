/// One row from the FMO equipment inventory: a piece of equipment kept at
/// a particular storage area, with how many are on hand.
class InventoryItem {
  const InventoryItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.location,
    required this.borrowable,
    this.imageAsset,
  });

  final String id;
  final String name;
  final int quantity;

  /// The storage area/section this equipment is kept at (e.g. "Qpav
  /// Mezzanine", "St. Raymund Back Area").
  final String location;

  /// Whether this equipment can be borrowed. Sourced from the "Borrowable"
  /// inventory sheet - everything currently on file is borrowable, but the
  /// field (and its filter) exist so non-borrowable equipment can be added
  /// later without a data-model change.
  final bool borrowable;

  /// Asset path for the equipment photo, or null when none has been taken
  /// yet - the card/detail page falls back to a placeholder in that case.
  final String? imageAsset;
}
