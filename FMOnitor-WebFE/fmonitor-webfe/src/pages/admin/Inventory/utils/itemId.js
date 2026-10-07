// Display form of an inventory item's database id, e.g. 42 -> "FMO-INV-0042".
// Ids past 9999 just grow wider.
export function formatItemId(id) {
  return `FMO-INV-${String(id).padStart(4, '0')}`
}
