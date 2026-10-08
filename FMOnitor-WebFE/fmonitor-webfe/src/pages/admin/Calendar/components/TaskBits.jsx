import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faClock, faLocationDot, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { STATUS_STYLES, TYPE_ICONS, isCompleted, isOverdue } from '../data/taskData'
import { formatTime } from '../utils/dateUtils'

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status].pill}`}>
      {status}
    </span>
  )
}

export function OverduePill() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
      <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5" />
      Overdue
    </span>
  )
}

export function TaskChip({ task, now, onOpen }) {
  const overdue = isOverdue(task, now)
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(task)
      }}
      title={`${formatTime(task.scheduledAt)} · ${task.title} (${task.status})`}
      className={`flex w-full cursor-pointer items-center gap-1 truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-semibold uppercase tracking-wide transition-all duration-150 hover:brightness-95 ${
        overdue ? 'border-red-200 bg-red-50 text-red-700' : STATUS_STYLES[task.status].chip
      }`}
    >
      {task.status === 'Delivered' && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5 shrink-0 text-emerald-500" />}
      <span className="truncate">{task.title}</span>
    </button>
  )
}

export function TaskCard({ task, now, onOpen, showDate = false, compact = false }) {
  const completed = isCompleted(task)
  const overdue = isOverdue(task, now)

  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className={`group flex w-full cursor-pointer gap-3 rounded-xl border bg-white text-left shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:border-[#fccb35] hover:shadow-lg ${
        compact ? 'p-2.5' : 'p-3'
      } ${overdue ? 'border-red-200' : 'border-gray-200'} ${completed ? 'opacity-70' : ''}`}
    >
      {!compact && (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            completed ? 'bg-gray-100 text-gray-400' : 'bg-[#fccb35]/20 text-[#a3790f]'
          }`}
        >
          <FontAwesomeIcon icon={TYPE_ICONS[task.type]} className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block break-words text-sm font-bold ${completed ? 'text-gray-500' : 'text-gray-900'} ${
            task.status === 'Cancelled' ? 'line-through' : ''
          }`}
        >
          {task.title}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-500">
          <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5 shrink-0 text-gray-400" />
          {showDate && `${task.scheduledAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · `}
          {formatTime(task.scheduledAt)}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
          <FontAwesomeIcon icon={faLocationDot} className="h-2.5 w-2.5 shrink-0 text-gray-400" />
          <span className="truncate">{task.destination}</span>
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1">
          <StatusPill status={task.status} />
          {overdue && <OverduePill />}
        </span>
      </span>
    </button>
  )
}
