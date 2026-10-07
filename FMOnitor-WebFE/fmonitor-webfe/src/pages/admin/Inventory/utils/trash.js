// Must match InventoryService.TRASH_RETENTION_DAYS on the backend.
export const TRASH_RETENTION_DAYS = 30

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export function purgeAt(deletedAt) {
  return new Date(new Date(deletedAt).getTime() + TRASH_RETENTION_DAYS * DAY)
}

// Time left before the backend purges a trashed item for good.
// e.g. "30 days", "1 day", "5 hours", "less than an hour"
export function timeUntilPurge(deletedAt, now = new Date()) {
  const msLeft = purgeAt(deletedAt) - now
  if (msLeft <= HOUR) return { label: 'less than an hour', daysLeft: 0 }
  if (msLeft < DAY) {
    const h = Math.floor(msLeft / HOUR)
    return { label: `${h} hour${h === 1 ? '' : 's'}`, daysLeft: 0 }
  }
  const d = Math.ceil(msLeft / DAY)
  return { label: `${d} day${d === 1 ? '' : 's'}`, daysLeft: d }
}
