import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { dayKey, formatTime, isSameDay } from '../utils/dateUtils'
import { TaskCard } from '../components/TaskBits'

const DEFAULT_START_HOUR = 6
const DEFAULT_END_HOUR = 20

function hourLabel(hour) {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric', hour12: true })
}

function DayView({ date, now, tasksByDay, onOpenTask, onAddAt }) {
  const tasks = tasksByDay.get(dayKey(date)) ?? []
  const isToday = isSameDay(date, now)
  const taskHours = tasks.map((t) => t.scheduledAt.getHours())
  const startHour = Math.min(DEFAULT_START_HOUR, ...taskHours)
  const endHour = Math.max(DEFAULT_END_HOUR, ...taskHours)
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i)

  return (
    <div className="divide-y divide-gray-100">
      {hours.map((hour) => {
        const inHour = tasks.filter((t) => t.scheduledAt.getHours() === hour)
        const isNowHour = isToday && now.getHours() === hour

        return (
          <div key={hour} className={`group flex gap-3 px-3 py-2 sm:px-4 ${isNowHour ? 'bg-[#fccb35]/10' : ''}`}>
            <div className="w-14 shrink-0 pt-1 text-right sm:w-16">
              <span className={`text-[11px] font-semibold ${isNowHour ? 'text-[#a3790f]' : 'text-gray-400'}`}>
                {hourLabel(hour)}
              </span>
              {isNowHour && (
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wide text-[#a3790f]">
                  Now {formatTime(now)}
                </span>
              )}
            </div>

            <div className="flex min-h-[44px] flex-1 flex-col gap-2 sm:grid sm:grid-cols-2 sm:items-start">
              {inHour.map((task) => (
                <TaskCard key={task.id} task={task} now={now} onOpen={onOpenTask} />
              ))}
              {inHour.length === 0 && (
                <button
                  type="button"
                  onClick={() => onAddAt(new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour))}
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-gray-300 opacity-100 transition-opacity duration-150 hover:bg-gray-50 hover:text-gray-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                  Add task at {hourLabel(hour)}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default DayView
