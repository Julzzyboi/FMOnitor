import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFilter,
  faCheck,
  faMapLocationDot,
  faLocationCrosshairs,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import { FACILITY_TYPES, FACILITY_TYPE_STYLES } from './rowStyles'

// Placeholder only - there's no delivery/task backend yet (no table, no API).
// This is just the UI shape (tabs + list) wired to a small hardcoded sample
// so the section isn't empty; swap for a real fetch once a backend endpoint
// exists, same pattern as facilities/campuses in index.jsx.
const MOCK_TASKS = {
  ongoing: [
    { id: 'TKT-2025-0517-001', route: 'Qpav Mezzanine → Plaza Mayor', status: 'In Transit', time: '10:30 AM', dot: 'bg-amber-400' },
    { id: 'TKT-2025-0517-002', route: 'FMO Garage → Quad Pavilion', status: 'Picked Up', time: '11:15 AM', dot: 'bg-purple-400' },
  ],
  completed: [
    {
      id: 'TKT-2025-0510-014',
      route: 'Bgpop Ground Floor → Grandstand',
      status: 'Delivered',
      time: 'Yesterday',
      dot: 'bg-emerald-400',
    },
  ],
}
const TASK_STATUS_STYLES = {
  'In Transit': 'bg-sky-100 text-sky-700',
  'Picked Up': 'bg-purple-100 text-purple-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
}

// Flat, ring-based (not border-based) so the edge blends into the row
// instead of reading as a separate boxed control, and the checkmark is
// always mounted, just scaled/faded in - a smoother "pop" than the old
// conditional-render snap.
function Checkbox({ checked }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
        checked ? 'bg-[#fccb35] shadow-sm shadow-[#fccb35]/50' : 'bg-gray-100 ring-1 ring-inset ring-gray-200 group-hover:ring-gray-300'
      }`}
    >
      <FontAwesomeIcon
        icon={faCheck}
        className={`h-3 w-3 text-gray-900 transition-all duration-200 ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
      />
    </span>
  )
}

function FilterNav({ open, visibleTypes, onToggleType, onSelectAll, onClearAll, onAddArea, placingArea }) {
  const [taskTab, setTaskTab] = useState('ongoing')
  const tasks = MOCK_TASKS[taskTab]

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-10 flex h-full w-80 max-w-[85vw] transform flex-col border-l border-gray-100 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="h-4 w-4 text-gray-400" />
          <span className="text-base font-bold text-gray-900">Filters</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSelectAll}
            className="cursor-pointer text-xs font-semibold text-[#a3790f] transition-colors duration-150 hover:underline"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="cursor-pointer text-xs font-semibold text-gray-400 transition-colors duration-150 hover:text-gray-600 hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="px-5 pb-5 pt-5">
        <button
          type="button"
          onClick={onAddArea}
          className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide shadow-sm transition-colors duration-150 ${
            placingArea
              ? 'border-[#fccb35] bg-[#fccb35] text-gray-900'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FontAwesomeIcon icon={placingArea ? faLocationCrosshairs : faMapLocationDot} className="h-3.5 w-3.5" />
          {placingArea ? 'Click the map…' : 'Add Area'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Area Types</span>
        </div>
        <div className="flex flex-col gap-1">
          {FACILITY_TYPES.map((type) => {
            const checked = visibleTypes.has(type)
            return (
              <button
                key={type}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onToggleType(type)}
                className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors duration-150 ${
                  checked ? 'bg-[#fccb35]/20 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Checkbox checked={checked} />
                <span className={`h-2 w-2 shrink-0 rounded-full ${FACILITY_TYPE_STYLES[type].bgClass}`} />
                <span className="min-w-0 flex-1 truncate">{type}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* pb-20 (not just a smaller gap) - the floating toggle button (a FAB,
          fixed bottom-6 right-6 in index.jsx) sits in this same bottom-right
          corner regardless of open/closed state, so this section needs real
          clearance or its own "View All" button ends up underneath it. A
          top border + its own top padding (rather than relying on the
          scroll area's own pb-5 above) keeps this card visually separated
          from the filter list instead of butting right up against it. */}
      <div className="border-t border-gray-100 px-5 pb-20 pt-5">
        <div className="rounded-xl border border-gray-200 bg-white pt-3">
          <div className="flex items-center justify-between px-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Active Delivery Tickets</span>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-gray-500 transition-colors duration-150 hover:text-gray-700"
            >
              View All
              <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
            </button>
          </div>

          <div className="flex px-3.5 pt-2.5">
            {[
              { key: 'ongoing', label: 'Ongoing' },
              { key: 'completed', label: 'Completed' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTaskTab(key)}
                className={`flex-1 cursor-pointer border-b-2 pb-1.5 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ${
                  taskTab === key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {label} ({MOCK_TASKS[key].length})
              </button>
            ))}
          </div>

          <div className="flex max-h-48 flex-col gap-3 overflow-y-auto p-3.5">
            {tasks.length === 0 && <p className="py-3 text-center text-xs text-gray-400">No {taskTab} tickets.</p>}
            {tasks.map((task) => (
              <div key={task.id} className="flex gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${task.dot}`} />
                <div className="min-w-0 flex-1">
                  {/* Route (origin -> destination) is the emphasized text now,
                      not the ticket id - that's what someone actually
                      navigates by. On its own full-width line and wrapping
                      (not truncating) so a long route never gets cut off -
                      it used to compete for space with the status badge on
                      one line, which is what forced the ellipsis. */}
                  <p className="break-words text-sm font-bold text-gray-900">{task.route}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TASK_STATUS_STYLES[task.status]}`}>
                      {task.status}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400">{task.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default FilterNav
