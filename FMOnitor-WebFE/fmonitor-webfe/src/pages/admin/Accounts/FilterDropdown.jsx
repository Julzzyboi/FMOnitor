import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../../hooks/useClickOutside'
import useFloatingPosition from '../../../hooks/useFloatingPosition'

function FilterDropdown({ label, options, value, onChange }) {
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
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300"
      >
        {label}: <span className="font-semibold text-gray-900">{value}</span>
        <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3 text-gray-400" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-44 animate-[dropdown-in_0.15s_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl"
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  close()
                }}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
              >
                {option}
                {value === option && <FontAwesomeIcon icon={faCheck} className="h-3 w-3 text-[#fccb35]" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

export default FilterDropdown
