import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faClockRotateLeft,
  faDownload,
  faFilter,
  faMagnifyingGlass,
  faArrowUpWideShort,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../components/layout/AdminPageShell'
import MOCK_AUDIT_LOGS from '../../data/mockAuditLogs'
import { HISTORY_LOG_TYPES } from '../../constants/navItems'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const PAGE_SIZE = 10

function ActionPill({ action }) {
  const styles = action === 'LOGGED OUT' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {action}
    </span>
  )
}

function pad(n) {
  return String(n).padStart(2, '0')
}

// 12-hour display format (e.g. "2026-08-30 11:51:15 PM"). The date portion
// stays zero-padded/ISO-ish for readability, but 12-hour time with an AM/PM
// suffix isn't safely sortable as plain text - "12:00 AM" (midnight) sorts
// AFTER "01-11 AM" alphabetically even though it comes first chronologically.
// So this is for DISPLAY only; sortKey (a real epoch number) is what the
// table actually sorts by.
function formatTimestamp12h(date) {
  const hours24 = date.getHours()
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12
  const ampm = hours24 < 12 ? 'AM' : 'PM'
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(hours12)}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${ampm}`
  )
}

// Real login logs and the (still mock, until a real feature exists) equipment
// logs have genuinely different shapes - this maps both into the same
// Login ID / User / Email / Role / Action / Timestamp row shape.
function mapAuditLog(log) {
  return {
    id: log.id,
    user: log.hauler,
    avatarUrl: null,
    email: '—',
    role: '—',
    action: log.category?.replace('_', ' ') || 'ACTIVITY',
    timestamp: formatTimestamp12h(log.timestamp),
    sortKey: log.timestamp.getTime(),
    category: log.category,
  }
}

function mapLoginLog(log) {
  const date = new Date(log.actionAt)
  return {
    id: `Log-${String(log.id).padStart(3, '0')}`,
    user: log.name || log.email,
    avatarUrl: log.pictureUrl,
    email: log.email,
    role: log.role,
    action: log.action,
    timestamp: formatTimestamp12h(date),
    sortKey: date.getTime(),
    category: 'LOGIN_ACTIVITY',
  }
}

function History() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'ALL')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const tab = searchParams.get('tab')
    setActiveTab(tab && HISTORY_LOG_TYPES.some((t) => t.key === tab) ? tab : 'ALL')
  }, [searchParams])

  useEffect(() => {
    setLoading(true)
    // TODO: the equipment-movement side (hauler/venue/equipment) is still mock
    // data until that feature actually exists on the backend - only login
    // activity below is real.
    fetch(`${API_BASE_URL}/api/login-logs`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((loginLogs) => {
        const combined = [...loginLogs.map(mapLoginLog), ...MOCK_AUDIT_LOGS.map(mapAuditLog)]
        combined.sort((a, b) => b.sortKey - a.sortKey)
        setLogs(combined)
      })
      .catch(() => setLogs(MOCK_AUDIT_LOGS.map(mapAuditLog)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, search])

  const counts = useMemo(() => {
    const result = { ALL: logs.length }
    for (const { key } of HISTORY_LOG_TYPES) {
      if (key !== 'ALL') result[key] = logs.filter((log) => log.category === key).length
    }
    return result
  }, [logs])

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (activeTab !== 'ALL' && log.category !== activeTab) return false
      if (!query) return true
      return (
        log.user?.toLowerCase().includes(query) ||
        log.email?.toLowerCase().includes(query) ||
        log.id?.toLowerCase().includes(query)
      )
    })
  }, [logs, activeTab, search])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pagedLogs = filteredLogs.slice(pageStart, pageStart + PAGE_SIZE)

  return (
    <AdminPageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
        <button
          type="button"
          disabled
          className="flex cursor-not-allowed items-center gap-2 rounded-full bg-[#fccb35] px-5 py-2.5 text-sm font-semibold text-gray-900 opacity-50"
        >
          <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />  
          Download Logs
        </button>
      </div>

      {loading ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-24 shadow-sm">
          <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-[#fccb35]" />
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {HISTORY_LOG_TYPES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-full px-4 py-2 text-xs font-bold tracking-wide uppercase transition-colors duration-150 ${
                  activeTab === key
                    ? 'bg-[#fccb35] text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label} <span className="ml-1 opacity-70">{counts[key]}</span>
              </button>
            ))}
          </div>

          {/* Search / refine / sort bar */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs by user, email, or log ID..."
              className="min-w-0 flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400"
            >
              <FontAwesomeIcon icon={faFilter} className="h-3.5 w-3.5" />
              REFINE
            </button>
            <button
              type="button"
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400"
            >
              <FontAwesomeIcon icon={faArrowUpWideShort} className="h-3.5 w-3.5" />
              SORT
            </button>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Login ID</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                      <FontAwesomeIcon icon={faClockRotateLeft} className="mb-3 h-8 w-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-900">No activity logs yet</p>
                    </td>
                  </tr>
                ) : (
                  pagedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{log.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {log.avatarUrl ? (
                            <img
                              src={log.avatarUrl}
                              alt=""
                              className="h-6 w-6 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-400">
                              {log.user?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                          <span className="text-gray-500">{log.user}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{log.email}</td>
                      <td className="px-4 py-3 text-gray-500">{log.role}</td>
                      <td className="px-4 py-3">
                        <ActionPill action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{log.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
            <p>
              Showing {pagedLogs.length} of {filteredLogs.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                PREV
              </button>
              <span className="rounded-lg bg-[#fccb35] px-3 py-1.5 text-xs font-bold text-gray-900">
                {currentPage}
              </span>
              <span className="px-1 text-xs text-gray-400">of {totalPages}</span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
              >
                NEXT
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
              </button>
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
  )
}

export default History
