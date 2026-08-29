import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import NAV_ITEMS from '../../constants/navItems'
import logoAdmin from '../../assets/logoAdmin.png'
import { performLogout } from '../../utils/logout'

function Sidebar({ open, onClose }) {
  const handleLogout = () => {
    performLogout()
  }

  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 transform flex-col bg-[#141414] transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : 'max-lg:-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-5 pb-4 pt-6">
          <img src={logoAdmin} alt="FMOnitor" className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight text-white">
            <span className="text-[#fccb35]">FMO</span>nitor
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, icon, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fccb35] text-gray-900'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#fccb35] transition-colors duration-150 hover:bg-white/10"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
