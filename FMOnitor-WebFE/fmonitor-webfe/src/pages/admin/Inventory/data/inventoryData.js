// Must match VALID_CONDITIONS / VALID_AVAILABILITY in InventoryItemController.java.
export const CONDITIONS = ['Good', 'Defect', 'Damaged', 'Missing']
export const AVAILABILITY_OPTIONS = ['Borrowable', 'Non-Borrowable']

// A critical item is one physical unit per ID (quantity 0 or 1); a
// non-critical item is bulk stock where one ID covers many units.
// Must match CRITICAL_MAX_QTY in InventoryItemController.java.
export const CRITICALITY_OPTIONS = ['Critical', 'Non-Critical']
export const CRITICAL_MAX_QTY = 1
export const criticalityOf = (item) => (item.critical ? 'Critical' : 'Non-Critical')

// Must match VALID_TYPES / VALID_STATUSES in InventoryReportController.java.
export const REPORT_TYPES = ['Damaged', 'Missing', 'Needs Repair', 'Other']
export const REPORT_STATUSES = ['Open', 'In Progress', 'Resolved']
