import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { PAGE_TITLES } from '../../constants/navItems'
import NotificationDropdown from './NotificationDropdown'
import ProfileDropdown from './ProfileDropdown'

function Topbar({ onOpenMenu }) {
  const { pathname } = useLocation()
  const currentTitle = PAGE_TITLES[pathname] ?? ''

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between bg-[#141414] px-3 lg:h-14 lg:border-b lg:border-gray-200 lg:bg-white lg:px-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="cursor-pointer rounded-md p-1.5 text-[#fccb35] transition-colors hover:bg-white/10 lg:hidden"
        >
          <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold text-[#fccb35] lg:text-lg lg:text-black">
          {currentTitle}
        </h2>
      </div>

      <div className="flex items-center gap-1.5 lg:gap-2">
        <NotificationDropdown />
        <ProfileDropdown />
      </div>
    </header>
  )
}

export default Topbar
