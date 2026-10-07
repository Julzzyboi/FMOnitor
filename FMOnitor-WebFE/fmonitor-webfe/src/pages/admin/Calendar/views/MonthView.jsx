import { WEEKDAYS, dayKey, getMonthGrid, isSameDay, isSameMonth } from '../utils/dateUtils'
import { STATUS_STYLES, isOverdue } from '../data/taskData'
import { TaskChip } from '../components/TaskBits'

const MAX_CHIPS = 2

function MonthView({ anchor, selectedDate, now, tasksByDay, onSelectDay, onOpenTask, onShowDay }) {
  const days = getMonthGrid(anchor)

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const tasks = tasksByDay.get(dayKey(day)) ?? []
          const inMonth = isSameMonth(day, anchor)
          const isToday = isSameDay(day, now)
          const isSelected = isSameDay(day, selectedDate)
          const hidden = tasks.length - MAX_CHIPS

          return (
            <div
              key={dayKey(day)}
              role="button"
              tabIndex={0}
              aria-label={`${day.toDateString()}, ${tasks.length} task${tasks.length === 1 ? '' : 's'}`}
              aria-pressed={isSelected}
              onClick={() => onSelectDay(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectDay(day)
                }
              }}
              className={`relative flex h-16 cursor-pointer flex-col gap-1 border-b border-r border-gray-100 p-1 text-left outline-none transition-colors duration-150 [&:nth-child(7n)]:border-r-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fccb35] sm:h-24 sm:p-1.5 md:h-28 ${
                isToday ? 'bg-[#fccb35]/10' : inMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/70 hover:bg-gray-100/70'
              } ${isSelected ? 'ring-2 ring-inset ring-[#fccb35]' : ''}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-xs font-semibold ${
                    isToday ? 'text-[#a3790f]' : inMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}
                >
                  {day.getDate()}
                </span>
                {isToday && (
                  <span className="hidden rounded-full bg-[#fccb35] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-900 sm:inline">
                    Today
                  </span>
                )}
              </div>

              <div className="hidden flex-col gap-1 sm:flex">
                {tasks.slice(0, MAX_CHIPS).map((task) => (
                  <TaskChip key={task.id} task={task} now={now} onOpen={onOpenTask} />
                ))}
                {hidden > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onShowDay(day)
                    }}
                    className="cursor-pointer self-start px-1 text-[10px] font-semibold text-gray-500 hover:text-gray-900 hover:underline"
                  >
                    +{hidden} more
                  </button>
                )}
              </div>

              {tasks.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                  {tasks.slice(0, 4).map((task) => (
                    <span
                      key={task.id}
                      className={`h-1.5 w-1.5 rounded-full ${isOverdue(task, now) ? 'bg-red-500' : STATUS_STYLES[task.status].dot}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthView
