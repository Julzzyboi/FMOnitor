// Must match VALID_CONDITIONS / VALID_AVAILABILITY in InventoryItemController.java.
export const CONDITIONS = ['Good', 'Defect', 'Damaged', 'Missing']
export const AVAILABILITY_OPTIONS = ['Borrowable', 'Non-Borrowable']

// Must match VALID_TYPES / VALID_STATUSES in InventoryReportController.java.
export const REPORT_TYPES = ['Damaged', 'Missing', 'Needs Repair', 'Other']
export const REPORT_STATUSES = ['Open', 'In Progress', 'Resolved']
