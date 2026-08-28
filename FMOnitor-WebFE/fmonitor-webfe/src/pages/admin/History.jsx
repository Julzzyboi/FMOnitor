import { useEffect, useMemo, useState } from 'react'
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

const TABS = [
  { key: 'ALL', label: 'ALL LOGS' },
  { key: 'CRITICAL_ALERTS', label: 'CRITICAL ALERTS' },
  { key: 'MAINTENANCE', label: 'MAINTENANCE' },
  { key: 'MOVEMENTS', label: 'MOVEMENTS' },
]

const PAGE_SIZE = 10

function StatusPill({ status }) {
  const styles = status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>
      {status}
    </span>
  )
}

function History() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [activeTab, setActiveTab] = useState('ALL')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    // TODO: replace with a real GET /api/audit-logs call once the backend
    // audit-logging feature exists. For now this is mock data.
    const timer = setTimeout(() => {
      setLogs(MOCK_AUDIT_LOGS)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, search])

  const counts = useMemo(
    () => ({
      ALL: logs.length,
      CRITICAL_ALERTS: logs.filter((log) => log.category === 'CRITICAL_ALERTS').length,
      MAINTENANCE: logs.filter((log) => log.category === 'MAINTENANCE').length,
      MOVEMENTS: logs.filter((log) => log.category === 'MOVEMENTS').length,
    }),
    [logs],
  )

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (activeTab !== 'ALL' && log.category !== activeTab) return false
      if (!query) return true
      return (
        log.hauler?.toLowerCase().includes(query) ||
        log.venue?.toLowerCase().includes(query) ||
        log.equipment?.toLowerCase().includes(query) ||
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
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-full px-4 py-2 text-xs font-bold tracking-wide transition-colors duration-150 ${
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
              placeholder="Search logs by user, action, target ID, or location..."
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
                  <th className="px-4 py-3">Log ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Hauler</th>
                  <th className="px-4 py-3">Venue</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Status</th>
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
                      <td className="px-4 py-3 text-gray-500">{log.timestamp}</td>
                      <td className="px-4 py-3 text-gray-500">{log.hauler}</td>
                      <td className="px-4 py-3 text-gray-500">{log.venue}</td>
                      <td className="px-4 py-3 text-gray-500">{log.equipment}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={log.status} />
                      </td>
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
