import {
  faBoxesStacked,
  faLandmark,
  faBriefcase,
  faFlask,
  faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons'

// Same shape as Accounts/rowStyles.js's ROLE_STYLES/STATUS_STYLES - an object
// keyed by the backend's exact value, each holding what the UI needs to render
// it. Must match FacilityController.VALID_TYPES on the backend exactly.
export const FACILITY_TYPE_STYLES = {
  Storage: { icon: faBoxesStacked, color: '#f97316', bgClass: 'bg-orange-500' },
  Venue: { icon: faLandmark, color: '#8b5cf6', bgClass: 'bg-violet-500' },
  Office: { icon: faBriefcase, color: '#3b82f6', bgClass: 'bg-blue-500' },
  Laboratory: { icon: faFlask, color: '#10b981', bgClass: 'bg-emerald-500' },
  Utility: { icon: faScrewdriverWrench, color: '#6b7280', bgClass: 'bg-gray-500' },
}

export const FACILITY_TYPES = Object.keys(FACILITY_TYPE_STYLES)
