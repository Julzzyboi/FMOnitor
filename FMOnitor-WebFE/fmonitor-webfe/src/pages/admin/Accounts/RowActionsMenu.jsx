import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical, faPen, faBan, faTrash, faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../../hooks/useClickOutside'
import useFloatingPosition from '../../../hooks/useFloatingPosition'

function RowActionsMenu({ user, onEdit, onDisable, onDelete, onRestore }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose: close, align: 'right' })
  useClickOutside([triggerRef, menuRef], close)

  const isDeleted = user.status === 'Deleted'
  const isDisabled = user.status === 'Disabled'

  const stop = (fn) => (e) => {
    e.stopPropagation()
    fn()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={stop(() => setOpen((v) => !v))}
        aria-label={`Actions for ${user.name}`}
        className="cursor-pointer rounded-md p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
      >
        <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-40 animate-[dropdown-in_0.15s_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 text-left shadow-xl"
          >
            {isDeleted ? (
              <button
                type="button"
                onClick={stop(() => {
                  close()
                  onRestore(user)
                })}
                className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-emerald-600 transition-colors duration-150 hover:bg-emerald-50"
              >
                <FontAwesomeIcon icon={faArrowRotateLeft} className="h-3.5 w-3.5" />
                Restore
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={stop(() => {
                    close()
                    onEdit(user)
                  })}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                  Edit
                </button>
                {!isDisabled && (
                  <button
                    type="button"
                    onClick={stop(() => {
                      close()
                      onDisable(user)
                    })}
                    className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-orange-600 transition-colors duration-150 hover:bg-orange-50"
                  >
                    <FontAwesomeIcon icon={faBan} className="h-3.5 w-3.5" />
                    Disable
                  </button>
                )}
                <button
                  type="button"
                  onClick={stop(() => {
                    close()
                    onDelete(user)
                  })}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

export default RowActionsMenu
