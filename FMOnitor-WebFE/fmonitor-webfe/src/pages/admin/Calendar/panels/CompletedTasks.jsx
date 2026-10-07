import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faClockRotateLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import Pagination from '../../../../components/common/Pagination'
import { COMPLETED_STATUSES, TASK_LOCATIONS, TASK_TYPES, TYPE_ICONS, isCompleted, matchesSearch } from '../data/taskData'
import { addDays, formatDate, formatTime, fromInputValues, startOfDay, toDateInputValue } from '../utils/dateUtils'
import { StatusPill } from '../components/TaskBits'

const PAGE_SIZE = 8

const RANGE_PRESETS = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All time' },
]

const SELECT_CLASS =
  'cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30'

function FilterField({ label, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function CompletedTasks({ tasks, now, onOpenTask, sectionRef }) {
  const [search, setSearch] = useState('')
  const [preset, setPreset] = useState('30')
  const [from, setFrom] = useState(() => toDateInputValue(addDays(now, -30)))
  const [to, setTo] = useState(() => toDateInputValue(now))
  const [status, setStatus] = useState('All')
  const [location, setLocation] = useState('All')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const applyPreset = (p) => {
    setPreset(p.key)
    if (p.days) {
      setFrom(toDateInputValue(addDays(now, -p.days)))
      setTo(toDateInputValue(now))
    } else {
      setFrom('')
      setTo('')
    }
  }

  const clearAll = () => {
    setSearch('')
    setStatus('All')
    setLocation('All')
    setType('All')
    applyPreset(RANGE_PRESETS[3])
  }

  const completed = useMemo(() => tasks.filter(isCompleted), [tasks])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const fromDate = from ? fromInputValues(from) : null
    const toDate = to ? addDays(fromInputValues(to), 1) : null
    const result = completed.filter((t) => {
      if (fromDate && t.scheduledAt < fromDate) return false
      if (toDate && t.scheduledAt >= toDate) return false
      if (status !== 'All' && t.status !== status) return false
      if (location !== 'All' && t.origin !== location && t.destination !== location) return false
      if (type !== 'All' && t.type !== type) return false
      return matchesSearch(t, query)
    })
    result.sort((a, b) => (sort === 'newest' ? b.scheduledAt - a.scheduledAt : a.scheduledAt - b.scheduledAt))
    return result
  }, [completed, search, from, to, status, location, type, sort])

  useEffect(() => {
    setPage(1)
  }, [search, from, to, status, location, type, sort])

  const delivered = filtered.filter((t) => t.status === 'Delivered').length
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const today = toDateInputValue(startOfDay(now))

  return (
    <section ref={sectionRef} id="completed-tasks" className="scroll-mt-20 rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">Completed Tasks</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span> matching ·{' '}
            <span className="font-semibold text-emerald-700">{delivered}</span> delivered ·{' '}
            <span className="font-semibold text-gray-600">{filtered.length - delivered}</span> cancelled
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors duration-150 ${
                preset === p.key ? 'bg-[#fccb35] text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-gray-100 px-5 py-4 md:grid-cols-4 xl:grid-cols-7">
        <div className="relative col-span-2 md:col-span-4 xl:col-span-2 xl:self-end">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticket, task, hauler…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
          />
        </div>
        <FilterField label="From">
          <input
            type="date"
            value={from}
            max={to || today}
            onChange={(e) => {
              setFrom(e.target.value)
              setPreset('custom')
            }}
            className={`${SELECT_CLASS} w-full`}
          />
        </FilterField>
        <FilterField label="To">
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value)
              setPreset('custom')
            }}
            className={`${SELECT_CLASS} w-full`}
          />
        </FilterField>
        <FilterField label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${SELECT_CLASS} w-full`}>
            <option>All</option>
            {COMPLETED_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Location">
          <select value={location} onChange={(e) => setLocation(e.target.value)} className={`${SELECT_CLASS} w-full`}>
            <option>All</option>
            {TASK_LOCATIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${SELECT_CLASS} w-full`}>
            <option>All</option>
            {TASK_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FilterField>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3">
        <button
          type="button"
          onClick={clearAll}
          className="cursor-pointer whitespace-nowrap text-[11px] font-semibold text-gray-400 transition-colors duration-150 hover:text-gray-600 hover:underline"
        >
          Clear filters
        </button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${SELECT_CLASS} w-auto`}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-5 pb-12 pt-6 text-center">
          <FontAwesomeIcon icon={faClockRotateLeft} className="h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-900">No completed tasks match these filters</p>
          <p className="mt-1 text-xs text-gray-400">Try a wider date range or clear the filters.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-y border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-5 py-3">Task</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Scheduled</th>
                  <th className="px-5 py-3">Hauler</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => onOpenTask(task)}
                    className="cursor-pointer border-b border-gray-50 transition-colors duration-150 last:border-0 hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-xs font-medium text-gray-500">{task.id}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <FontAwesomeIcon icon={TYPE_ICONS[task.type]} className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className={`font-semibold text-gray-900 ${task.status === 'Cancelled' ? 'line-through' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-[11px] text-gray-400">{task.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {task.origin} <FontAwesomeIcon icon={faArrowRight} className="mx-1 h-2.5 w-2.5 text-gray-300" />{' '}
                      {task.destination}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">
                      {formatDate(task.scheduledAt)}
                      <span className="block text-[11px] text-gray-400">{formatTime(task.scheduledAt)}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{task.hauler}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={task.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2.5 px-4 pb-2 md:hidden">
            {paged.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task)}
                className="cursor-pointer rounded-xl border border-gray-200 p-3 text-left transition-colors duration-150 hover:border-[#fccb35]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold text-gray-900 ${task.status === 'Cancelled' ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <StatusPill status={task.status} />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  {task.origin} → {task.destination}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {formatDate(task.scheduledAt)} · {formatTime(task.scheduledAt)} · {task.id}
                </p>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              label="tasks"
            />
          </div>
        </>
      )}
    </section>
  )
}

export default CompletedTasks
