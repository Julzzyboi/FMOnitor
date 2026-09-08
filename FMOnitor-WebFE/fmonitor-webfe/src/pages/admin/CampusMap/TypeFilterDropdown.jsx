import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faCheck, faFilter } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../../hooks/useClickOutside'
import useFloatingPosition from '../../../hooks/useFloatingPosition'
import { FACILITY_TYPES, FACILITY_TYPE_STYLES } from './rowStyles'

// A plain <input type="checkbox"> is notoriously hard to restyle consistently
// across browsers, so this is a custom checkbox square (a styled span, not a
// real input) that toggles the same way - checked state driven entirely by
// `checked`, not any native form state.
function Checkbox({ checked }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
        checked ? 'border-[#fccb35] bg-[#fccb35]' : 'border-gray-300 bg-white'
      }`}
    >
      {checked && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5 text-gray-900" />}
    </span>
  )
}

// Multi-select, unlike Accounts/FilterDropdown (exactly one value) - each
// type toggles independently in/out of `visibleTypes`, so any combination
// of Building/Field/Gate/Venue/Storage/etc. can be shown at once.
function TypeFilterDropdown({ visibleTypes, onToggleType, onSelectAll, onClearAll }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  // align: 'left' - this trigger sits near the left edge of the map (to stay
  // clear of the details sidebar docked on the right), so the menu should
  // anchor from the trigger's left edge, not push off-screen trying to align
  // to its right edge the way Accounts/FilterDropdown's right-side button does.
  const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose: close, align: 'left' })
  useClickOutside([triggerRef, menuRef], close)

  const activeCount = visibleTypes.size

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide shadow-sm transition-colors duration-150 ${
          activeCount > 0
            ? 'border-[#fccb35] bg-[#fccb35] text-gray-900'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <FontAwesomeIcon icon={faFilter} className="h-3.5 w-3.5" />
        {activeCount > 0 ? `Showing ${activeCount}` : 'Filter Areas'}
        <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-56 animate-[dropdown-in_0.15s_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-50 px-4 py-2">
              <button
                type="button"
                onClick={onSelectAll}
                className="cursor-pointer text-xs font-semibold text-[#a3790f] hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="cursor-pointer text-xs font-semibold text-gray-400 hover:underline"
              >
                Clear All
              </button>
            </div>
            {FACILITY_TYPES.map((type) => {
              const checked = visibleTypes.has(type)
              return (
                <button
                  key={type}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => onToggleType(type)}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
                >
                  <Checkbox checked={checked} />
                  <span className={`h-2 w-2 rounded-full ${FACILITY_TYPE_STYLES[type].bgClass}`} />
                  {type}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}

export default TypeFilterDropdown
