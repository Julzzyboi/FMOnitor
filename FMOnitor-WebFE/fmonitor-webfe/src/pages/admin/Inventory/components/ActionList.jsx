import { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faListCheck, faLock, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import useNow from '../../../../hooks/useNow'
import { CHANGE_ACTIONS, CHANGE_STATUS_STYLES } from '../data/changeRequests'
import { formatRelativeTime } from '../utils/timeFormat'

const HISTORY_LIMIT = 30

// Sidebar panel with the approval queue. Superadmins see every Admin's
// pending change (oldest first - the order they're decided in); Admins see
// their own requests. Clicking a row opens the full request.
function ActionList({ title, requests, isSuperadmin, blockedByMap, onOpen }) {
  const [tab, setTab] = useState('pending')
  const now = useNow(30000)

  const pending = useMemo(
    () => requests.filter((r) => r.status === 'Pending').sort((a, b) => a.id - b.id),
    [requests],
  )
  const history = useMemo(
    () =>
      requests
        .filter((r) => r.status !== 'Pending')
        .sort((a, b) => new Date(b.reviewedAt ?? b.requestedAt) - new Date(a.reviewedAt ?? a.requestedAt))
        .slice(0, HISTORY_LIMIT),
    [requests],
  )
  const rows = tab === 'pending' ? pending : history

  return (
    <div className="mt-4 rounded-xl bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <FontAwesomeIcon icon={faListCheck} className="h-3.5 w-3.5 text-gray-400" />
          {title}
        </span>
        {pending.length > 0 && (
          <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {pending.length}
          </span>
        )}
      </div>

      <div role="tablist" className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
        {[
          ['pending', 'Pending'],
          ['history', 'History'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`cursor-pointer rounded-md py-1 text-[11px] font-bold uppercase tracking-wide transition-colors duration-150 ${
              tab === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-2 max-h-72 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-gray-400">
            {tab === 'pending'
              ? isSuperadmin
                ? 'Nothing waiting for approval.'
                : 'No changes waiting for approval.'
              : 'No decided requests yet.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {rows.map((r) => {
              const action = CHANGE_ACTIONS[r.action] ?? { label: r.action, style: 'bg-gray-100 text-gray-600' }
              const blockedBy = isSuperadmin && r.status === 'Pending' ? blockedByMap.get(r.id) : null
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(r)}
                    title={blockedBy ? `Waiting on request #${blockedBy}` : undefined}
                    className="group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-gray-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`shrink-0 rounded px-1.5 py-px text-[10px] font-bold ${action.style}`}>
                          {action.label}
                        </span>
                        {blockedBy && <FontAwesomeIcon icon={faLock} className="h-2.5 w-2.5 shrink-0 text-amber-600" />}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-semibold text-gray-900">
                        {r.itemName ?? 'New item'}
                      </span>
                      <span className="block truncate text-[11px] text-gray-400">
                        {tab === 'history' ? (
                          <span className={`mr-1 rounded-full px-1.5 py-px font-semibold ring-1 ring-inset ${CHANGE_STATUS_STYLES[r.status]}`}>
                            {r.status}
                          </span>
                        ) : (
                          isSuperadmin && `${r.requestedByName} · `
                        )}
                        {formatRelativeTime(tab === 'history' ? (r.reviewedAt ?? r.requestedAt) : r.requestedAt, now)}
                      </span>
                    </span>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="h-2.5 w-2.5 shrink-0 text-gray-300 transition-colors duration-150 group-hover:text-gray-500"
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ActionList
