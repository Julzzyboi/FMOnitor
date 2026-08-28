import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../hooks/useClickOutside'
import useFloatingPosition from '../../hooks/useFloatingPosition'

function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose: close, align: 'right' })
  useClickOutside([triggerRef, menuRef], close)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="flex h-[45px] w-[45px] cursor-pointer items-center justify-center rounded-full text-[#fccb35] transition-colors duration-150 hover:bg-white/10 lg:text-black lg:hover:bg-gray-100"
      >
        <FontAwesomeIcon icon={faBell} className="h-6 w-6" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-72 max-w-[calc(100vw-2rem)] animate-[dropdown-in_0.15s_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
            </div>

            <div className="max-h-72 space-y-4 overflow-y-auto p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default NotificationDropdown
