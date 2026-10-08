// Chart fills use deeper steps of the same hues as the app's status pills
// (CONDITION_STYLES, report/task STATUS_STYLES) so a pale pill and its bar
// segment read as the same state. Gray is reserved for the neutral states.

export const CONDITION_COLORS = {
  Good: '#059669',
  Defect: '#f59e0b',
  Damaged: '#dc2626',
  Missing: '#64748b',
}

export const REPORT_STATUS_COLORS = {
  Open: '#dc2626',
  'In Progress': '#f59e0b',
  Resolved: '#059669',
}

export const TASK_STATUS_COLORS = {
  Scheduled: '#f59e0b',
  'Picked Up': '#9333ea',
  'In Transit': '#0284c7',
  Delivered: '#059669',
  Cancelled: '#9ca3af',
}

// Single-series bars: ink by default, brand yellow on hover.
export const BAR_COLOR = '#1f2937'
export const BAR_HIGHLIGHT = '#fccb35'
