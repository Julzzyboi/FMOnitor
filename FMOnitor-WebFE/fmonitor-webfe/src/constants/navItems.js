import {
  faTableCellsLarge,
  faClipboardList,
  faCalendarDays,
  faMapLocationDot,
  faChartBar,
  faClockRotateLeft,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'

export const HISTORY_LOG_TYPES = [
  { key: 'ALL', label: 'All Activity' },
  { key: 'LOGIN_ACTIVITY', label: 'Login Activity' },
  { key: 'CRITICAL_ALERTS', label: 'Critical Alerts' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
  { key: 'MOVEMENTS', label: 'Movements' },
]

const NAV_ITEMS = [
  { label: 'Dashboard', icon: faTableCellsLarge, to: '/dashboard' },
  { label: 'Inventory', icon: faClipboardList, to: '/inventory' },
  { label: 'Calendar', icon: faCalendarDays, to: '/calendar' },
  { label: 'Campus Map', icon: faMapLocationDot, to: '/campus-map' },
  { label: 'Analytics', icon: faChartBar, to: '/analytics' },
  { label: 'History', icon: faClockRotateLeft, to: '/history' },
  { label: 'Accounts', icon: faUsers, to: '/accounts', roles: ['Superadmin'] },
]

export const PAGE_TITLES = {
  ...Object.fromEntries(NAV_ITEMS.map((item) => [item.to, item.label])),
  '/profile': 'Profile',
}

export default NAV_ITEMS
