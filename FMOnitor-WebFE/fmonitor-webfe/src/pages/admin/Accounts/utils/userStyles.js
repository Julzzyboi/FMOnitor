import { formatYmdTime12h } from '../../../../utils/dateTime'

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

export const PURGE_RETENTION_DAYS = 90

export function daysUntilPurge(deletedAt) {
  if (!deletedAt) return null
  const elapsedMs = Date.now() - new Date(deletedAt).getTime()
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))
  return Math.max(0, PURGE_RETENTION_DAYS - elapsedDays)
}

export function purgeDate(deletedAt) {
  if (!deletedAt) return null
  const purgeMs = new Date(deletedAt).getTime() + PURGE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  return formatYmdTime12h(new Date(purgeMs))
}
