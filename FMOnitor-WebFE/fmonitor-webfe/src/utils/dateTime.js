// The app always shows 12-hour times with AM/PM, never 24-hour time,
// whatever the viewer's locale would default to.

const pad = (n) => String(n).padStart(2, '0')

// 17:05 -> "05:05 PM"
export function formatClock12h(date) {
  const hours24 = date.getHours()
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  return `${pad(hours12)}:${pad(date.getMinutes())} ${hours24 < 12 ? 'AM' : 'PM'}`
}

// "2026-10-07 05:05 PM" - the compact table style used on Accounts.
export function formatYmdTime12h(value) {
  const d = value instanceof Date ? value : new Date(value)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${formatClock12h(d)}`
}
