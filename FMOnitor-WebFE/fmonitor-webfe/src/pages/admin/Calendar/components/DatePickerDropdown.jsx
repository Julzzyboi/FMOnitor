import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../../../hooks/useClickOutside'
import useFloatingPosition from '../../../../hooks/useFloatingPosition'
import { WEEKDAYS, addMonths, dayKey, getMonthGrid, isSameDay, isSameMonth, startOfDay } from '../dateUtils'

const FIRST_YEAR = 1900
const LAST_YEAR = 2100
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i)
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'long' }))

const SELECT_CLASS =
  'cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30'

// Same day-of-month in another month/year, clamped (Jan 31 -> Feb 28/29).
function withMonthYear(date, month, year) {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(date.getDate(), lastDay))
}

// The calendar header's range label doubles as a jump-to-date picker: the
// month/year dropdowns (1900-2100) move the calendar straight away, picking a
// day selects it and closes. Days with tickets carry a dot.
function DatePickerDropdown({ label, selectedDate, now, tasksByDay, onSelect }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose: close, align: 'left' })
  useClickOutside([triggerRef, menuRef], close)

  const days = getMonthGrid(selectedDate)

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 transition-colors duration-150 hover:bg-gray-100"
      >
        <span className="truncate text-sm font-bold uppercase tracking-wide text-gray-900">{label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`h-2.5 w-2.5 shrink-0 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Jump to date"
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-72 max-w-[calc(100vw-1rem)] animate-[dropdown-in_0.15s_ease-out] rounded-xl border border-gray-100 bg-white p-3 shadow-xl"
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelect(addMonths(selectedDate, -1))}
                disabled={selectedDate.getFullYear() === FIRST_YEAR && selectedDate.getMonth() === 0}
                aria-label="Previous month"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-default disabled:opacity-30"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
              </button>
              <select
                value={selectedDate.getMonth()}
                onChange={(e) => onSelect(withMonthYear(selectedDate, Number(e.target.value), selectedDate.getFullYear()))}
                aria-label="Month"
                className={`${SELECT_CLASS} min-w-0 flex-1`}
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={selectedDate.getFullYear()}
                onChange={(e) => onSelect(withMonthYear(selectedDate, selectedDate.getMonth(), Number(e.target.value)))}
                aria-label="Year"
                className={SELECT_CLASS}
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onSelect(addMonths(selectedDate, 1))}
                disabled={selectedDate.getFullYear() === LAST_YEAR && selectedDate.getMonth() === 11}
                aria-label="Next month"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-default disabled:opacity-30"
              >
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 text-center">
              {WEEKDAYS.map((d) => (
                <span key={d} className="pb-1 text-[10px] font-bold uppercase text-gray-400">
                  {d.charAt(0)}
                </span>
              ))}
              {days.map((day) => {
                const selected = isSameDay(day, selectedDate)
                const today = isSameDay(day, now)
                const hasTasks = tasksByDay.has(dayKey(day))
                return (
                  <button
                    key={dayKey(day)}
                    type="button"
                    onClick={() => {
                      onSelect(startOfDay(day))
                      close()
                    }}
                    aria-label={day.toDateString()}
                    aria-current={today ? 'date' : undefined}
                    className={`relative mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold transition-colors duration-150 ${
                      selected
                        ? 'bg-[#fccb35] text-gray-900'
                        : today
                          ? 'text-[#a3790f] ring-1 ring-inset ring-[#fccb35] hover:bg-[#fccb35]/20'
                          : isSameMonth(day, selectedDate)
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.getDate()}
                    {hasTasks && (
                      <span
                        className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? 'bg-gray-900' : 'bg-[#fccb35]'}`}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 flex justify-end border-t border-gray-100 pt-2">
              <button
                type="button"
                onClick={() => {
                  onSelect(startOfDay(now))
                  close()
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#a3790f] transition-colors duration-150 hover:bg-[#fccb35]/20"
              >
                Jump to Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default DatePickerDropdown
