import SectionCard, { SectionEmpty } from '../../../../components/common/SectionCard'
import { STATUS_STYLES, isOverdue } from '../../Calendar/data/taskData'
import { addDays, isSameDay } from '../../Calendar/utils/dateUtils'
import { formatClock12h } from '../../../../utils/dateTime'

function dayLabel(date, now) {
  if (isSameDay(date, now)) return 'Today'
  if (isSameDay(date, addDays(now, 1))) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

function UpcomingTasks({ tasks, now, className = '' }) {
  return (
    <SectionCard
      title="Upcoming Tasks"
      subtitle="Deliveries, retrievals and setups still in progress"
      action={{ label: 'Calendar', to: '/calendar' }}
      className={className}
    >
      {tasks.length === 0 ? (
        <SectionEmpty message="No active tasks — you're all caught up." />
      ) : (
        <ul className="-mx-2 flex flex-col divide-y divide-gray-100">
          {tasks.map((task) => {
            const overdue = isOverdue(task, now)
            return (
              <li
                key={task.id}
                className="flex items-center gap-4 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-gray-50"
              >
                <div className="w-20 shrink-0">
                  <p
                    className={`text-[11px] font-bold uppercase tracking-wide ${
                      overdue ? 'text-red-600' : 'text-gray-400'
                    }`}
                  >
                    {overdue ? 'Overdue' : dayLabel(task.scheduledAt, now)}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-gray-900">
                    {formatClock12h(task.scheduledAt)}
                  </p>
                </div>

                <div className="min-w-0 flex-1 border-l-2 border-gray-100 pl-4">
                  <p className="truncate text-sm font-semibold text-gray-900">{task.title}</p>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {task.origin} <span className="text-gray-400">to</span> {task.destination}
                  </p>
                </div>

                <span
                  className={`w-20 shrink-0 rounded-full px-2 py-1 text-center text-[11px] font-semibold ${STATUS_STYLES[task.status].pill}`}
                >
                  {task.status}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}

export default UpcomingTasks
