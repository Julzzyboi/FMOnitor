import {
  faBuilding,
  faFutbol,
  faChair,
  faWater,
  faLandmark,
  faSeedling,
  faDoorOpen,
  faBasketball,
  faBoxesStacked,
} from '@fortawesome/free-solid-svg-icons'

export const FACILITY_TYPE_STYLES = {
  Building: { icon: faBuilding, color: '#3b82f6', bgClass: 'bg-blue-500' },
  Field: { icon: faFutbol, color: '#22c55e', bgClass: 'bg-green-500' },
  Grandstand: { icon: faChair, color: '#f59e0b', bgClass: 'bg-amber-500' },
  Pool: { icon: faWater, color: '#06b6d4', bgClass: 'bg-cyan-500' },
  'In-Campus Grounds': { icon: faLandmark, color: '#8b5cf6', bgClass: 'bg-violet-500' },
  Garden: { icon: faSeedling, color: '#10b981', bgClass: 'bg-emerald-500' },
  Gate: { icon: faDoorOpen, color: '#6b7280', bgClass: 'bg-gray-500' },
  Court: { icon: faBasketball, color: '#f43f5e', bgClass: 'bg-rose-500' },
  Venue: { icon: faLandmark, color: '#a855f7', bgClass: 'bg-purple-500' },
  Storage: { icon: faBoxesStacked, color: '#f97316', bgClass: 'bg-orange-500' },
}

export const FACILITY_TYPES = Object.keys(FACILITY_TYPE_STYLES)

export const CAMPUS_AREA_TYPES = [
  'Building',
  'Field',
  'Grandstand',
  'Pool',
  'In-Campus Grounds',
  'Garden',
  'Gate',
  'Court',
]

const MOCK_EVENT_COUNTS = [
  { scheduled: 3, active: 1 },
  { scheduled: 5, active: 0 },
  { scheduled: 2, active: 1 },
  { scheduled: 4, active: 2 },
  { scheduled: 1, active: 0 },
]
export function mockEventCounts(id) {
  return MOCK_EVENT_COUNTS[id % MOCK_EVENT_COUNTS.length]
}
