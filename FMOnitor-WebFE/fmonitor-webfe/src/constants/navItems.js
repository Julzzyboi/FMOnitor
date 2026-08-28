import {
  faTableCellsLarge,
  faClipboardList,
  faCalendarDays,
  faMapLocationDot,
  faChartBar,
  faClockRotateLeft,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'

// Sidebar nav — Profile lives in the topbar's profile dropdown instead, not here.
const NAV_ITEMS = [
  { label: 'Dashboard', icon: faTableCellsLarge, to: '/dashboard' },
  { label: 'Inventory', icon: faClipboardList, to: '/inventory' },
  { label: 'Calendar', icon: faCalendarDays, to: '/calendar' },
  { label: 'Campus Map', icon: faMapLocationDot, to: '/campus-map' },
  { label: 'Analytics', icon: faChartBar, to: '/analytics' },
  { label: 'History', icon: faClockRotateLeft, to: '/history' },
  { label: 'Accounts', icon: faUsers, to: '/accounts' },
]

// Topbar page titles — includes every admin route, even ones (like Profile)
// that aren't in the sidebar.
export const PAGE_TITLES = {
  ...Object.fromEntries(NAV_ITEMS.map((item) => [item.to, item.label])),
  '/profile': 'Profile',
}

export default NAV_ITEMS
