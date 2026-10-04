import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faPen,
  faTrash,
  faArrowRight,
  faBan,
  faRotateLeft,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons'
import { NEXT_STATUS, TYPE_ICONS, isCompleted, isOverdue, taskEnd } from '../taskData'
import { formatDateTime, formatDayLabel, formatTime } from '../dateUtils'
import { OverduePill, StatusPill } from '../components/TaskBits'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-50 py-3 last:border-0">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-right text-sm text-gray-900">{value}</span>
    </div>
  )
}

// Opened from any chip/card/row. The primary button walks the ticket one
// step forward (Scheduled -> Picked Up -> In Transit -> Delivered); a
// finished ticket can be reopened instead. Laid out like Inventory's
// EquipmentDetailsModal.
function TaskDetailsModal({ task, now, onClose, onEdit, onDelete, onSetStatus }) {
  const completed = isCompleted(task)
  const next = NEXT_STATUS[task.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        className="relative flex max-h-full w-full max-w-md animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 id="task-details-title" className="text-base font-bold text-gray-900">
            Task Details
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                completed ? 'bg-gray-100 text-gray-400' : 'bg-[#fccb35]/20 text-[#a3790f]'
              }`}
            >
              <FontAwesomeIcon icon={TYPE_ICONS[task.type]} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {task.id} · {task.type}
              </p>
              <p className={`mt-0.5 text-lg font-bold text-gray-900 ${task.status === 'Cancelled' ? 'line-through' : ''}`}>
                {task.title}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <StatusPill status={task.status} />
                {isOverdue(task, now) && <OverduePill />}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <DetailRow label="Date" value={formatDayLabel(task.scheduledAt)} />
            <DetailRow label="Time" value={`${formatTime(task.scheduledAt)} – ${formatTime(taskEnd(task))}`} />
            <DetailRow
              label="Route"
              value={
                <>
                  {task.origin}
                  <FontAwesomeIcon icon={faArrowRight} className="mx-1.5 h-2.5 w-2.5 text-gray-300" />
                  {task.destination}
                </>
              }
            />
            <DetailRow label="Items" value={task.items || '—'} />
            <DetailRow label="Hauler" value={task.hauler} />
            {task.completedAt && (
              <DetailRow
                label={task.status === 'Delivered' ? 'Delivered at' : 'Cancelled at'}
                value={formatDateTime(task.completedAt)}
              />
            )}
            {task.notes && <DetailRow label="Notes" value={task.notes} />}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 border-t border-gray-100 px-6 py-4">
          {next && (
            <button
              type="button"
              onClick={() => onSetStatus(next)}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fccb35] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f]"
            >
              <FontAwesomeIcon icon={next === 'Delivered' ? faCircleCheck : faArrowRight} className="h-3.5 w-3.5" />
              Mark as {next}
            </button>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onDelete}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
              Delete
            </button>
            {completed ? (
              <button
                type="button"
                onClick={() => onSetStatus('Scheduled')}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
              >
                <FontAwesomeIcon icon={faRotateLeft} className="h-3.5 w-3.5" />
                Reopen
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSetStatus('Cancelled')}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
              >
                <FontAwesomeIcon icon={faBan} className="h-3.5 w-3.5" />
                Cancel Task
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailsModal
