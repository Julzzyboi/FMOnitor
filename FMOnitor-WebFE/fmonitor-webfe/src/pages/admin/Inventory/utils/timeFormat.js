const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// "just now", "5 minutes ago", "3 hours ago", "yesterday", "4 days ago",
// then the plain date once it's over a week old.
export function formatRelativeTime(iso, now = new Date()) {
  if (!iso) return '—'
  const date = new Date(iso)
  const diff = now - date
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `${m} minute${m === 1 ? '' : 's'} ago`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  if (diff < 2 * DAY) return 'yesterday'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
