import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleUser, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../hooks/useClickOutside'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false))

  const handleLogout = () => {
    window.location.href = `${API_BASE_URL}/logout`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        className="flex h-[45px] w-[45px] cursor-pointer items-center justify-center rounded-full text-[#fccb35] transition-colors duration-150 hover:bg-white/10 lg:text-black lg:hover:bg-gray-100"
      >
        <FontAwesomeIcon icon={faCircleUser} className="h-7 w-7" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
