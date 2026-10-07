export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return target
}

export function startOfWeek(date) {
  return addDays(date, -date.getDay())
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export function dayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function getMonthGrid(anchor) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
  const weeks = Math.ceil((first.getDay() + daysInMonth) / 7)
  const start = startOfWeek(first)
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
}

export function getWeekDays(anchor) {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function toDateInputValue(date) {
  return dayKey(date)
}

export function toTimeInputValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromInputValues(dateValue, timeValue = '00:00') {
  const [y, m, d] = dateValue.split('-').map(Number)
  const [h, min] = timeValue.split(':').map(Number)
  return new Date(y, m - 1, d, h || 0, min || 0)
}

export function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(date, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  return date.toLocaleDateString(undefined, options)
}

export function formatDateTime(date) {
  return `${formatDate(date)} · ${formatTime(date)}`
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function formatWeekLabel(date) {
  const [start, end] = [startOfWeek(date), addDays(startOfWeek(date), 6)]
  const sameYear = start.getFullYear() === end.getFullYear()
  const startLabel = start.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
  return `${startLabel} – ${formatDate(end)}`
}

export function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatRelativeDay(date, now) {
  const diff = Math.round((startOfDay(date) - startOfDay(now)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
