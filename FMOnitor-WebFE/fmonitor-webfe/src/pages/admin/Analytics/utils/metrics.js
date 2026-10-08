import { addDays, startOfWeek } from '../../Calendar/utils/dateUtils'

const HOUR = 36e5
const MAX_LOCATIONS = 6

const shortDate = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

// Report counts per bucket: the last 8 weeks (Sunday starts) or the last 6 months.
export function reportTrend(reports, range, now = new Date()) {
  const buckets = []
  if (range === 'weekly') {
    const thisWeek = startOfWeek(now)
    for (let i = 7; i >= 0; i--) {
      const start = addDays(thisWeek, -7 * i)
      buckets.push({ start, end: addDays(start, 7), label: shortDate(start), tooltip: `Week of ${shortDate(start)}` })
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      buckets.push({
        start,
        end,
        label: start.toLocaleDateString(undefined, { month: 'short' }),
        tooltip: start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      })
    }
  }

  return buckets.map((b) => ({
    key: b.start.toISOString(),
    label: b.label,
    tooltip: b.tooltip,
    value: reports.filter((r) => {
      const created = new Date(r.createdAt)
      return created >= b.start && created < b.end
    }).length,
  }))
}

// Units per storage location, largest first; the long tail folds into "Other".
export function unitsByLocation(items) {
  const totals = new Map()
  for (const item of items) totals.set(item.location, (totals.get(item.location) ?? 0) + (item.available ?? 0))
  const rows = [...totals.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  if (rows.length <= MAX_LOCATIONS) return rows
  const other = rows.slice(MAX_LOCATIONS - 1).reduce((sum, r) => sum + r.value, 0)
  return [...rows.slice(0, MAX_LOCATIONS - 1), { label: 'Other locations', value: other }]
}

export function countBy(list, key, keys) {
  const counts = Object.fromEntries(keys.map((k) => [k, 0]))
  for (const entry of list) if (entry[key] in counts) counts[entry[key]] += 1
  return counts
}

// "6 hrs" under two days, "3.5 days" after that; null when nothing is resolved.
export function averageResolution(reports) {
  const durations = reports
    .filter((r) => r.status === 'Resolved' && r.resolvedAt && r.createdAt)
    .map((r) => new Date(r.resolvedAt) - new Date(r.createdAt))
    .filter((ms) => ms >= 0)
  if (durations.length === 0) return null
  const avgHours = durations.reduce((a, b) => a + b, 0) / durations.length / HOUR
  if (avgHours < 48) {
    const hours = Math.max(1, Math.round(avgHours))
    return `${hours} hr${hours === 1 ? '' : 's'}`
  }
  return `${(avgHours / 24).toFixed(1)} days`
}
