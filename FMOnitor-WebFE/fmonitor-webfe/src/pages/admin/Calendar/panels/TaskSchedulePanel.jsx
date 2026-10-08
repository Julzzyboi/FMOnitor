import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarXmark, faPlus, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { formatRelativeDay } from '../utils/dateUtils'
import { isCompleted } from '../data/taskData'
import { TaskCard } from '../components/TaskBits'

function TaskSchedulePanel({ selectedDate, now, tasks, onOpenTask, onViewDay, onAddTask, onViewCompleted }) {
  const active = tasks.filter((t) => !isCompleted(t))
  const done = tasks.filter(isCompleted)

  return (
    <aside className="w-full shrink-0 rounded-2xl bg-white shadow-lg xl:sticky xl:top-20 xl:w-80">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Ticket Schedule</p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">
            {formatRelativeDay(selectedDate, now)}
            <span className="ml-1.5 font-medium text-gray-400">
              {selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#fccb35]/20 px-2.5 py-1 text-[11px] font-bold text-[#a3790f]">
          {active.length} active
        </span>
      </div>

      <div className="grid max-h-[60vh] grid-cols-1 content-start gap-2.5 overflow-y-auto p-4 sm:grid-cols-2 xl:max-h-[calc(100vh-17rem)] xl:grid-cols-1">
        {tasks.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-8 text-center">
            <FontAwesomeIcon icon={faCalendarXmark} className="h-7 w-7 text-gray-300" />
            <p className="mt-2 text-sm font-medium text-gray-900">No tickets on this day</p>
            <button
              type="button"
              onClick={onAddTask}
              className="mt-3 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#a3790f] hover:underline"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
              Schedule a task
            </button>
          </div>
        )}

        {active.map((task) => (
          <TaskCard key={task.id} task={task} now={now} onOpen={onOpenTask} />
        ))}

        {done.length > 0 && (
          <>
            <p className="col-span-full mt-1 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">Completed ({done.length})</p>
            {done.map((task) => (
              <TaskCard key={task.id} task={task} now={now} onOpen={onOpenTask} />
            ))}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={onViewDay}
          className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50"
        >
          View Complete Day
        </button>
        <button
          type="button"
          onClick={onViewCompleted}
          className="flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-semibold text-gray-500 transition-colors duration-150 hover:text-gray-800"
        >
          <FontAwesomeIcon icon={faClockRotateLeft} className="h-3 w-3" />
          Browse completed tasks
        </button>
      </div>
    </aside>
  )
}

export default TaskSchedulePanel
