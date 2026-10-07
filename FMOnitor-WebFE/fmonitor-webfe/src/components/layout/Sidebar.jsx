import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import NAV_ITEMS from '../../constants/navItems'
import logoAdmin from '../../assets/logoAdmin.png'
import { performLogout } from '../../utils/logout'
import { useAuth } from '../../context/AuthContext'

const COLLAPSED_STORAGE_KEY = 'sidebarCollapsed'

const LABEL_TRANSITION =
  'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-in-out'

function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role))

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(collapsed))
    } catch {}
  }, [collapsed])

  const handleLogout = () => {
    performLogout()
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-52 transform flex-col overflow-x-hidden bg-[#141414] transition-[width,transform] duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
          collapsed ? 'lg:w-16' : 'lg:w-52'
        } ${open ? 'translate-x-0' : 'max-lg:-translate-x-full'}`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex w-full cursor-pointer items-center gap-2 px-4 pb-4 pt-6"
        >
          <img src={logoAdmin} alt="FMOnitor" className="h-8 w-8 shrink-0" />
          <span
            className={`${LABEL_TRANSITION} max-w-[140px] text-left text-lg font-bold tracking-tight text-white opacity-100 ${
              collapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-[140px] lg:opacity-100'
            }`}
          >
            <span className="text-[#fccb35]">FMO</span>nitor
          </span>
        </button>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3">
          <ul className="flex flex-col gap-1">
            {visibleNavItems.map(({ label, icon, to }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#fccb35] text-gray-900'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <FontAwesomeIcon icon={icon} className="h-4 w-4 shrink-0" />
                  <span
                    className={`${LABEL_TRANSITION} max-w-[140px] opacity-100 ${
                      collapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-[140px] lg:opacity-100'
                    }`}
                  >
                    {label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#fccb35] transition-colors duration-150 hover:bg-white/10"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4 shrink-0" />
            <span
              className={`${LABEL_TRANSITION} max-w-[140px] opacity-100 ${
                collapsed ? 'lg:max-w-0 lg:opacity-0' : 'lg:max-w-[140px] lg:opacity-100'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
