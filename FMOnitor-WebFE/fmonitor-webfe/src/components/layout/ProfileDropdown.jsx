import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../hooks/useClickOutside'
import useFloatingPosition from '../../hooks/useFloatingPosition'
import { performLogout } from '../../utils/logout'
import { useAuth } from '../../context/AuthContext'

function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const close = () => setOpen(false)
  const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose: close, align: 'right' })
  useClickOutside([triggerRef, menuRef], close)

  const handleLogout = () => {
    performLogout()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        className="flex h-[45px] w-[45px] cursor-pointer items-center justify-center rounded-full text-[#fccb35] transition-colors duration-150 hover:bg-white/10 lg:text-black lg:hover:bg-gray-100"
      >
        {user?.picture ? (
          <img
            src={user.picture}
            alt={user.name || 'Profile'}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <FontAwesomeIcon icon={faCircleUser} className="h-7 w-7" />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-44 animate-[dropdown-in_0.15s_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl"
          >
            <Link
              to="/profile"
              onClick={close}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
              Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
              Logout
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}

export default ProfileDropdown
