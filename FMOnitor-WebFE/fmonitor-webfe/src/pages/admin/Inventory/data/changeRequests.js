// Must match ACTION_* / STATUS_* in tbl_InventoryChangeRequests.java.
export const CHANGE_ACTIONS = {
  Create: { label: 'Add item', style: 'bg-emerald-100 text-emerald-800' },
  Update: { label: 'Edit item', style: 'bg-sky-100 text-sky-800' },
  Trash: { label: 'Move to trash', style: 'bg-amber-100 text-amber-800' },
  Restore: { label: 'Restore', style: 'bg-violet-100 text-violet-800' },
  PermanentDelete: { label: 'Delete forever', style: 'bg-red-100 text-red-700' },
}

export const CHANGE_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled']

export const CHANGE_STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Cancelled: 'bg-gray-100 text-gray-500 ring-gray-200',
}

// For "only the oldest pending request per item can be decided": maps each
// blocked pending request id to the id of the earlier request it waits on.
export function blockedRequests(requests) {
  const firstPendingByItem = new Map()
  const blocked = new Map()
  for (const r of [...requests].sort((a, b) => a.id - b.id)) {
    if (r.status !== 'Pending' || r.itemId == null) continue
    if (firstPendingByItem.has(r.itemId)) blocked.set(r.id, firstPendingByItem.get(r.itemId))
    else firstPendingByItem.set(r.itemId, r.id)
  }
  return blocked
}
