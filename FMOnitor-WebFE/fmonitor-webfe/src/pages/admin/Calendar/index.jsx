import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faPlus,
  faSliders,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import ConfirmModal from '../Accounts/modals/ConfirmModal'
import Toast from '../Accounts/components/Toast'
import useNow from '../../../hooks/useNow'
import useClickOutside from '../../../hooks/useClickOutside'
import useFloatingPosition from '../../../hooks/useFloatingPosition'
import MonthView from './views/MonthView'
import WeekView from './views/WeekView'
import DayView from './views/DayView'
import TaskSchedulePanel from './panels/TaskSchedulePanel'
import CompletedTasks from './panels/CompletedTasks'
import TaskDetailsModal from './modals/TaskDetailsModal'
import TaskModal from './modals/TaskModal'
import DatePickerDropdown from './components/DatePickerDropdown'
import { STATUS_STYLES, TASK_STATUSES, TASK_TYPES, generateTasks, isCompleted, nextTicketId } from './data/taskData'
import {
  addDays,
  addMonths,
  dayKey,
  formatDayLabel,
  formatMonthLabel,
  formatTime,
  formatWeekLabel,
  getWeekDays,
  isSameDay,
  isSameMonth,
  startOfDay,
} from './utils/dateUtils'

const VIEWS = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

function Checkbox({ checked }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
        checked ? 'bg-[#fccb35] shadow-sm shadow-[#fccb35]/50' : 'bg-gray-100 ring-1 ring-inset ring-gray-200 group-hover:ring-gray-300'
      }`}
    >
      <FontAwesomeIcon
        icon={faCheck}
        className={`h-2.5 w-2.5 text-gray-900 transition-all duration-200 ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
      />
    </span>
  )
}

function toggleInSet(setState, value) {
  setState((prev) => {
    const next = new Set(prev)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  })
}

function CalendarFilter({ visibleStatuses, setVisibleStatuses, visibleTypes, setVisibleTypes }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose: close, align: 'right' })
  useClickOutside([triggerRef, menuRef], close)
  const activeCount = visibleStatuses.size + visibleTypes.size

  const section = (title, options, visible, setVisible) => (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      {options.map((option) => {
        const checked = visible.has(option)
        return (
          <button
            key={option}
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => toggleInSet(setVisible, option)}
            className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors duration-150 ${
              checked ? 'bg-[#fccb35]/20 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Checkbox checked={checked} />
            {STATUS_STYLES[option] && <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_STYLES[option].dot}`} />}
            <span className="truncate">{option}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Filter schedule"
        aria-expanded={open}
        className={`relative cursor-pointer rounded-lg p-2 transition-colors duration-150 ${
          activeCount ? 'bg-[#fccb35]/20 text-[#a3790f]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }`}
      >
        <FontAwesomeIcon icon={faSliders} className="h-3.5 w-3.5" />
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fccb35] px-1 text-[9px] font-bold text-gray-900">
            {activeCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-56 animate-[dropdown-in_0.15s_ease-out] rounded-xl border border-gray-100 bg-white p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-bold text-gray-900">Show</span>
              <button
                type="button"
                onClick={() => {
                  setVisibleStatuses(new Set())
                  setVisibleTypes(new Set())
                }}
                className="cursor-pointer text-[11px] font-semibold text-gray-400 hover:text-gray-600 hover:underline"
              >
                Clear all
              </button>
            </div>
            {section('Status', TASK_STATUSES, visibleStatuses, setVisibleStatuses)}
            {section('Type', TASK_TYPES, visibleTypes, setVisibleTypes)}
          </div>,
          document.body,
        )}
    </>
  )
}

function CalendarContent() {
  const now = useNow()
  const [tasks, setTasks] = useState(() => generateTasks(new Date()))
  const [view, setView] = useState('month')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [visibleStatuses, setVisibleStatuses] = useState(() => new Set())
  const [visibleTypes, setVisibleTypes] = useState(() => new Set())
  const [viewingId, setViewingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [newTaskStart, setNewTaskStart] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [toast, setToast] = useState(null)
  const completedRef = useRef(null)

  const todayKey = dayKey(now)
  const prevTodayKey = useRef(todayKey)
  useEffect(() => {
    if (prevTodayKey.current === todayKey) return
    setSelectedDate((sel) => (dayKey(sel) === prevTodayKey.current ? startOfDay(now) : sel))
    prevTodayKey.current = todayKey
  }, [todayKey, now])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const viewingTask = tasks.find((t) => t.id === viewingId) ?? null
  const editingTask = tasks.find((t) => t.id === editingId) ?? null

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (confirmingDelete) setConfirmingDelete(false)
      else if (editingId) setEditingId(null)
      else if (newTaskStart) setNewTaskStart(null)
      else if (viewingId) setViewingId(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmingDelete, editingId, newTaskStart, viewingId])

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!visibleStatuses.size || visibleStatuses.has(t.status)) &&
          (!visibleTypes.size || visibleTypes.has(t.type)),
      ),
    [tasks, visibleStatuses, visibleTypes],
  )

  const tasksByDay = useMemo(() => {
    const map = new Map()
    for (const task of visibleTasks) {
      const key = dayKey(task.scheduledAt)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(task)
    }
    for (const list of map.values()) list.sort((a, b) => a.scheduledAt - b.scheduledAt)
    return map
  }, [visibleTasks])

  const activeInRange = useMemo(() => {
    const inRange =
      view === 'month'
        ? (d) => isSameMonth(d, selectedDate)
        : view === 'week'
          ? (d) => getWeekDays(selectedDate).some((w) => isSameDay(w, d))
          : (d) => isSameDay(d, selectedDate)
    return visibleTasks.filter((t) => !isCompleted(t) && inRange(t.scheduledAt)).length
  }, [visibleTasks, view, selectedDate])

  const navigate = (dir) => {
    setSelectedDate((d) => (view === 'month' ? addMonths(d, dir) : addDays(d, view === 'week' ? 7 * dir : dir)))
  }

  const rangeLabel =
    view === 'month' ? formatMonthLabel(selectedDate) : view === 'week' ? formatWeekLabel(selectedDate) : formatDayLabel(selectedDate)

  const openNewTask = (start) => {
    if (start) return setNewTaskStart(start)
    if (isSameDay(selectedDate, now)) {
      const d = new Date(now)
      d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0)
      return setNewTaskStart(d)
    }
    setNewTaskStart(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 8))
  }

  const showDay = (day) => {
    setSelectedDate(startOfDay(day))
    setView('day')
  }

  const handleAdd = (payload) => {
    setTasks((prev) => {
      const task = { ...payload, id: nextTicketId(prev, payload.scheduledAt), status: 'Scheduled', completedAt: null }
      return [...prev, task].sort((a, b) => a.scheduledAt - b.scheduledAt)
    })
    setSelectedDate(startOfDay(payload.scheduledAt))
    setNewTaskStart(null)
    setToast({ message: `${payload.title} scheduled`, type: 'success' })
  }

  const handleEdit = (payload) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, ...payload } : t)).sort((a, b) => a.scheduledAt - b.scheduledAt),
    )
    setEditingId(null)
    setToast({ message: 'Changes saved successfully', type: 'success' })
  }

  const handleSetStatus = (status) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === viewingId ? { ...t, status, completedAt: ['Delivered', 'Cancelled'].includes(status) ? new Date() : null } : t,
      ),
    )
    setToast({
      message: `${viewingTask.id} marked as ${status}`,
      type: status === 'Cancelled' ? 'warning' : 'success',
    })
  }

  const handleDelete = () => {
    setTasks((prev) => prev.filter((t) => t.id !== viewingId))
    setToast({ message: `${viewingTask.title} deleted`, type: 'danger' })
    setConfirmingDelete(false)
    setViewingId(null)
  }

  const openTask = (task) => setViewingId(task.id)

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{formatDayLabel(now)}</h1>
          <p className="mt-1 text-xs font-semibold text-gray-700">{formatTime(now)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-lg border border-gray-200 bg-white p-1" role="tablist" aria-label="Calendar view">
            {VIEWS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors duration-150 ${
                  view === key ? 'bg-[#fccb35] text-gray-900' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => openNewTask()}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#fccb35] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            New Task
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start">
        <section className="min-w-0 flex-1 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <DatePickerDropdown
                label={rangeLabel}
                selectedDate={selectedDate}
                now={now}
                tasksByDay={tasksByDay}
                onSelect={setSelectedDate}
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label={`Previous ${view}`}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-800"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate(1)}
                  aria-label={`Next ${view}`}
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-800"
                >
                  <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(startOfDay(now))}
                disabled={isSameDay(selectedDate, now)}
                className="shrink-0 cursor-pointer rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-600 transition-colors duration-150 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#fccb35]/20 px-2.5 py-1 text-[11px] font-bold text-[#a3790f]">
                {activeInRange} Active Task{activeInRange === 1 ? '' : 's'}
              </span>
              <CalendarFilter
                visibleStatuses={visibleStatuses}
                setVisibleStatuses={setVisibleStatuses}
                visibleTypes={visibleTypes}
                setVisibleTypes={setVisibleTypes}
              />
            </div>
          </div>

          {view === 'month' && (
            <MonthView
              anchor={selectedDate}
              selectedDate={selectedDate}
              now={now}
              tasksByDay={tasksByDay}
              onSelectDay={(day) => setSelectedDate(startOfDay(day))}
              onOpenTask={openTask}
              onShowDay={showDay}
            />
          )}
          {view === 'week' && (
            <WeekView
              anchor={selectedDate}
              selectedDate={selectedDate}
              now={now}
              tasksByDay={tasksByDay}
              onSelectDay={(day) => setSelectedDate(startOfDay(day))}
              onOpenTask={openTask}
            />
          )}
          {view === 'day' && (
            <DayView date={selectedDate} now={now} tasksByDay={tasksByDay} onOpenTask={openTask} onAddAt={openNewTask} />
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-gray-100 px-4 py-3 sm:px-5">
            {TASK_STATUSES.map((status) => (
              <span key={status} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`} />
                {status}
              </span>
            ))}
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Overdue
            </span>
          </div>
        </section>

        <TaskSchedulePanel
          selectedDate={selectedDate}
          now={now}
          tasks={tasksByDay.get(dayKey(selectedDate)) ?? []}
          onOpenTask={openTask}
          onViewDay={() => showDay(selectedDate)}
          onAddTask={() => openNewTask()}
          onViewCompleted={() => completedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      </div>

      <div className="mt-6">
        <CompletedTasks tasks={tasks} now={now} onOpenTask={openTask} sectionRef={completedRef} />
      </div>

      {createPortal(
        <>
          {viewingTask && !editingTask && (
            <TaskDetailsModal
              task={viewingTask}
              now={now}
              onClose={() => setViewingId(null)}
              onEdit={() => setEditingId(viewingTask.id)}
              onDelete={() => setConfirmingDelete(true)}
              onSetStatus={handleSetStatus}
            />
          )}
          {editingTask && <TaskModal task={editingTask} onCancel={() => setEditingId(null)} onSubmit={handleEdit} />}
          {newTaskStart && <TaskModal defaultStart={newTaskStart} onCancel={() => setNewTaskStart(null)} onSubmit={handleAdd} />}
          {confirmingDelete && viewingTask && (
            <ConfirmModal
              variant="danger"
              title="Delete this task?"
              message={`${viewingTask.id} (${viewingTask.title}) will be removed from the schedule. This can't be undone.`}
              confirmLabel="Delete"
              onConfirm={handleDelete}
              onCancel={() => setConfirmingDelete(false)}
            />
          )}
          {toast && <Toast message={toast.message} type={toast.type} />}
        </>,
        document.body,
      )}
    </>
  )
}

function Calendar() {
  return (
    <AdminPageShell>
      <CalendarContent />
    </AdminPageShell>
  )
}

export default Calendar
