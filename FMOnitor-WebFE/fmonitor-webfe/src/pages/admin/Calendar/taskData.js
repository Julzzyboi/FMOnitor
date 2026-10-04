import { faTruck, faRotateLeft, faPeopleCarryBox, faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { BORROWABLE_STORAGE_AREAS } from '../Inventory/inventoryData'
import { addDays, dayKey } from './dateUtils'

// Placeholder only - there's no delivery/task backend yet (no table, no API),
// same as CampusMap/FilterNav's "Active Delivery Tickets" these are modeled
// on: TKT-YYYY-MMDD-NNN ids, an origin -> destination route, and the same
// Picked Up / In Transit / Delivered statuses. Everything lives in the
// Calendar page's local state; swap generateTasks() for a real fetch once an
// endpoint exists and the rest of the page barely has to change.

export const ACTIVE_STATUSES = ['Scheduled', 'Picked Up', 'In Transit']
export const COMPLETED_STATUSES = ['Delivered', 'Cancelled']
export const TASK_STATUSES = [...ACTIVE_STATUSES, ...COMPLETED_STATUSES]

// pill = status badge, chip = calendar event chip, dot = small marker.
// Picked Up / In Transit / Delivered match CampusMap's TASK_STATUS_STYLES.
export const STATUS_STYLES = {
  Scheduled: {
    pill: 'bg-amber-100 text-amber-700',
    chip: 'border-amber-200 bg-amber-50 text-amber-800',
    dot: 'bg-amber-400',
  },
  'Picked Up': {
    pill: 'bg-purple-100 text-purple-700',
    chip: 'border-purple-200 bg-purple-50 text-purple-800',
    dot: 'bg-purple-400',
  },
  'In Transit': {
    pill: 'bg-sky-100 text-sky-700',
    chip: 'border-sky-200 bg-sky-50 text-sky-800',
    dot: 'bg-sky-400',
  },
  Delivered: {
    pill: 'bg-emerald-100 text-emerald-700',
    chip: 'border-gray-200 bg-gray-50 text-gray-400',
    dot: 'bg-emerald-400',
  },
  Cancelled: {
    pill: 'bg-gray-100 text-gray-500',
    chip: 'border-gray-200 bg-gray-50 text-gray-400 line-through',
    dot: 'bg-gray-300',
  },
}

// The next step a ticket moves to from each active status.
export const NEXT_STATUS = {
  Scheduled: 'Picked Up',
  'Picked Up': 'In Transit',
  'In Transit': 'Delivered',
}

export const TASK_TYPES = ['Delivery', 'Retrieval', 'Event Setup', 'Transfer']
export const TYPE_ICONS = {
  Delivery: faTruck,
  Retrieval: faRotateLeft,
  'Event Setup': faPeopleCarryBox,
  Transfer: faArrowRightArrowLeft,
}

// Locations are the real storage areas from the inventory count sheet plus
// the campus venues equipment usually gets hauled to.
const VENUES = ['Plaza Mayor', 'Quad Pavilion', 'Benavides Park', 'Main Building Lobby', 'Medicine Auditorium']
export const TASK_LOCATIONS = [...new Set([...BORROWABLE_STORAGE_AREAS, 'FMO Garage', ...VENUES])].sort()

export const HAULERS = ['Juan Dela Cruz', 'Mark Reyes', 'Paolo Santos', 'Rico Mendoza']
export const DURATIONS = [30, 60, 90, 120, 180, 240]

export function isCompleted(task) {
  return COMPLETED_STATUSES.includes(task.status)
}

export function taskEnd(task) {
  return new Date(task.scheduledAt.getTime() + task.durationMins * 60000)
}

// Still active, but its whole time slot has already passed.
export function isOverdue(task, now) {
  return !isCompleted(task) && taskEnd(task) < now
}

export function matchesSearch(task, query) {
  if (!query) return true
  return [task.id, task.title, task.items, task.origin, task.destination, task.hauler, task.type].some((field) =>
    field?.toLowerCase().includes(query),
  )
}

export function nextTicketId(tasks, date) {
  const prefix = `TKT-${date.getFullYear()}-${dayKey(date).slice(5).replace('-', '')}-`
  const used = tasks.filter((t) => t.id.startsWith(prefix)).map((t) => Number(t.id.slice(prefix.length)) || 0)
  return `${prefix}${String(Math.max(0, ...used) + 1).padStart(3, '0')}`
}

// Four placeholder tickets, laid out relative to `now` so the calendar always
// has something on "today", something upcoming and a completed one.
// The first three are the exact tickets CampusMap/FilterNav shows, so both
// pages agree.
export function generateTasks(now) {
  const tasks = []
  const at = (dayOffset, hour, minute = 0) => {
    const d = addDays(now, dayOffset)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute)
  }
  const add = (task) => {
    const id = nextTicketId(tasks, task.scheduledAt)
    tasks.push({ id, notes: '', completedAt: null, ...task })
  }

  add({
    title: 'Plaza Mayor Mass Setup',
    type: 'Delivery',
    items: 'Lifetime Chairs ×300',
    origin: 'Qpav Mezzanine',
    destination: 'Plaza Mayor',
    hauler: 'Juan Dela Cruz',
    scheduledAt: at(0, 10, 30),
    durationMins: 90,
    status: 'In Transit',
  })
  add({
    title: 'Quad Pavilion Stage Build',
    type: 'Event Setup',
    items: 'Platforms 4x8 ×16',
    origin: 'FMO Garage',
    destination: 'Quad Pavilion',
    hauler: 'Mark Reyes',
    scheduledAt: at(0, 11, 15),
    durationMins: 120,
    status: 'Picked Up',
  })
  add({
    title: 'Grandstand Tent Drop-off',
    type: 'Delivery',
    items: 'Tent Clothes (Medium 12x24) ×6',
    origin: 'Bgpop Ground Floor',
    destination: 'Grandstand',
    hauler: 'Paolo Santos',
    scheduledAt: at(-1, 14),
    durationMins: 60,
    status: 'Delivered',
    completedAt: at(-1, 14, 52),
  })
  add({
    title: 'Career Fair Delivery',
    type: 'Delivery',
    items: 'Lifetime Table ×20',
    origin: 'Grandstand',
    destination: 'Benavides Park',
    hauler: 'Rico Mendoza',
    scheduledAt: at(2, 8),
    durationMins: 120,
    status: 'Scheduled',
  })

  return tasks.sort((a, b) => a.scheduledAt - b.scheduledAt)
}
