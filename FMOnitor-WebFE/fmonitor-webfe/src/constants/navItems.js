import {
  faTableCellsLarge,
  faClipboardList,
  faCalendarDays,
  faMapLocationDot,
  faChartBar,
  faClockRotateLeft,
  faUsers,
  faUser,
} from '@fortawesome/free-solid-svg-icons'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: faTableCellsLarge, to: '/dashboard' },
  { label: 'Inventory', icon: faClipboardList, to: '/inventory' },
  { label: 'Calendar', icon: faCalendarDays, to: '/calendar' },
  { label: 'Campus Map', icon: faMapLocationDot, to: '/campus-map' },
  { label: 'Analytics', icon: faChartBar, to: '/analytics' },
  { label: 'History', icon: faClockRotateLeft, to: '/history' },
  { label: 'Accounts', icon: faUsers, to: '/accounts' },
  { label: 'Profile', icon: faUser, to: '/profile' },
]

export default NAV_ITEMS
