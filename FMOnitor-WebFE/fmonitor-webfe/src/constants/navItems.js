import {
  faTableCellsLarge,
  faClipboardList,
  faCalendarDays,
  faMapLocationDot,
  faChartBar,
  faClockRotateLeft,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'

// History log type tabs - rendered as in-page buttons on the History page itself.
export const HISTORY_LOG_TYPES = [
  { key: 'ALL', label: 'All Activity' },
  { key: 'LOGIN_ACTIVITY', label: 'Login Activity' },
  { key: 'CRITICAL_ALERTS', label: 'Critical Alerts' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
  { key: 'MOVEMENTS', label: 'Movements' },
]

// Sidebar nav — Profile lives in the topbar's profile dropdown instead, not here.
// `roles` is optional - omitted means every role sees the item; when present,
// only a user whose role is in the list sees it. Accounts is Superadmin-only,
// matching the /accounts route guard (RequireRole) and the backend's own
// isSuperadmin() check - this just keeps a Non-Superadmin from seeing a link
// to a page they'd immediately get redirected away from anyway.
const NAV_ITEMS = [
  { label: 'Dashboard', icon: faTableCellsLarge, to: '/dashboard' },
  { label: 'Inventory', icon: faClipboardList, to: '/inventory' },
  { label: 'Calendar', icon: faCalendarDays, to: '/calendar' },
  { label: 'Campus Map', icon: faMapLocationDot, to: '/campus-map' },
  { label: 'Analytics', icon: faChartBar, to: '/analytics' },
  { label: 'History', icon: faClockRotateLeft, to: '/history' },
  { label: 'Accounts', icon: faUsers, to: '/accounts', roles: ['Superadmin'] },
]

// Topbar page titles — includes every admin route, even ones (like Profile)
// that aren't in the sidebar.
export const PAGE_TITLES = {
  ...Object.fromEntries(NAV_ITEMS.map((item) => [item.to, item.label])),
  '/profile': 'Profile',
}

export default NAV_ITEMS
