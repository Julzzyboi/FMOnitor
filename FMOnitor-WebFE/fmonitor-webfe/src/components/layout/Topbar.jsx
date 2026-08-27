import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import NAV_ITEMS from '../../constants/navItems'
import NotificationDropdown from './NotificationDropdown'
import ProfileDropdown from './ProfileDropdown'

function Topbar({ onOpenMenu }) {
  const { pathname } = useLocation()
  const currentTitle = NAV_ITEMS.find((item) => item.to === pathname)?.label ?? ''

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#141414] px-4 lg:h-20 lg:border-b lg:border-gray-200 lg:bg-white lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="cursor-pointer rounded-md p-2 text-[#fccb35] transition-colors hover:bg-white/10 lg:hidden"
        >
          <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold text-[#fccb35] lg:text-xl lg:text-black">
          {currentTitle}
        </h2>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </header>
  )
}

export default Topbar
