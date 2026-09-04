export const ROLE_STYLES = {
  Superadmin: { dot: 'bg-[#fccb35]', text: 'text-[#a3790f] font-bold' },
  Admin: { dot: 'bg-blue-500', text: 'text-gray-800 font-semibold' },
  Hauler: { dot: 'bg-violet-500', text: 'text-gray-800 font-semibold' },
  Requestor: { dot: 'bg-gray-400', text: 'text-gray-800 font-semibold' },
}

export const STATUS_STYLES = {
  Active: 'bg-emerald-500 text-white',
  Inactive: 'bg-gray-400 text-white',
  Unregistered: 'bg-sky-500 text-white',
  Disabled: 'bg-orange-500 text-white',
  Deleted: 'bg-red-600 text-white',
}

// Must match AccountCleanupScheduler.RETENTION_DAYS on the backend - the
// auto-purge window for archived (Deleted) accounts.
export const PURGE_RETENTION_DAYS = 90

// Days remaining before an archived account is auto-purged, or null if it
// isn't archived at all (no deletedAt). Floored at 0 rather than going
// negative - the backend's scheduler will have already caught it by the
// time this could show a negative number, but stay safe as text either way.
export function daysUntilPurge(deletedAt) {
  if (!deletedAt) return null
  const elapsedMs = Date.now() - new Date(deletedAt).getTime()
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  return Math.max(0, PURGE_RETENTION_DAYS - elapsedDays)
}

// The actual date/time the account will be (or was) auto-purged - deletedAt
// plus the retention window, not just a relative day count. Same
// "YYYY-MM-DD HH:MM" shape as the Date Created column so the two read
// consistently side by side.
export function purgeDate(deletedAt) {
  if (!deletedAt) return null
  const purgeMs = new Date(deletedAt).getTime() + PURGE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  const d = new Date(purgeMs)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
