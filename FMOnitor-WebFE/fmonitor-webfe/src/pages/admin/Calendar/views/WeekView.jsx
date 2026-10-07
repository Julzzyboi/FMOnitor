import { dayKey, getWeekDays, isSameDay } from '../utils/dateUtils'
import { TaskCard } from '../components/TaskBits'

function WeekView({ anchor, selectedDate, now, tasksByDay, onSelectDay, onOpenTask }) {
  const days = getWeekDays(anchor)

  return (
    <div className="grid grid-cols-1 md:grid-cols-7">
      {days.map((day) => {
        const tasks = tasksByDay.get(dayKey(day)) ?? []
        const isToday = isSameDay(day, now)
        const isSelected = isSameDay(day, selectedDate)

        return (
          <div
            key={dayKey(day)}
            className={`flex flex-col border-b border-gray-100 md:min-h-[420px] md:border-b-0 md:border-r md:last:border-r-0 ${
              isToday ? 'bg-[#fccb35]/10' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-gray-50 md:flex-col md:items-center md:gap-0.5 md:border-b md:border-gray-100 ${
                isSelected ? 'ring-2 ring-inset ring-[#fccb35]' : ''
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                  isToday ? 'bg-[#fccb35] text-gray-900' : 'text-gray-700'
                }`}
              >
                {day.getDate()}
              </span>
              <span className="ml-auto text-[11px] text-gray-400 md:hidden">
                {tasks.length} task{tasks.length === 1 ? '' : 's'}
              </span>
            </button>

            <div className="flex flex-col gap-2 px-3 pb-3 md:p-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} now={now} onOpen={onOpenTask} compact />
              ))}
              {tasks.length === 0 && <p className="hidden py-4 text-center text-[11px] text-gray-300 md:block">—</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default WeekView
