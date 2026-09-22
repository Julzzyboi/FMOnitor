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

// Same shape as Accounts/rowStyles.js's ROLE_STYLES/STATUS_STYLES - an object
// keyed by the backend's exact value, each holding what the UI needs to
// render it. The first 8 match tbl_CampusAreas' real categories (the UST
// GeoJSON dataset's areaType); Venue/Storage correspond to the two separate
// dedicated tables (tbl_venues, tbl_storage) instead of a type column - see
// index.jsx, which fetches all three sources and tags each row with this
// same `type` field so the rest of this folder's rendering code doesn't need
// to know which backend table/endpoint a given row actually came from.
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

// The 8 real tbl_CampusAreas categories, as opposed to Venue/Storage (their
// own dedicated tables). Used for e.g. the "which campus area is this
// storage embedded in" dropdown, which should only list actual areas/
// buildings, not other venues or storage rows.
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

// No real inventory backend yet (no counts, no line items anywhere in the
// data model) - this cycles through a fixed, plausible-looking sequence
// (not random) so a given facility shows the same stub count on every
// render/reload instead of jumping around, until a real inventory endpoint
// exists to replace this. Shared between FilterNav's per-row counts and
// AreaDetailsContent's "Items Available" so the two stay consistent with
// each other for the same facility.
const MOCK_ITEM_COUNTS = [8, 5, 6, 5, 4, 5, 6, 4, 6, 4, 4, 4, 2]
export function mockItemCount(id) {
  return MOCK_ITEM_COUNTS[id % MOCK_ITEM_COUNTS.length]
}
