import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faUserCheck, faUserSlash, faUserClock } from '@fortawesome/free-solid-svg-icons'

const CARDS = [
  {
    key: 'total',
    label: 'Total Users',
    icon: faUsers,
    iconColor: 'text-[#a3790f]',
    iconBg: 'bg-[#fccb35]/20',
  },
  {
    key: 'active',
    label: 'Active Users',
    icon: faUserCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    key: 'inactive',
    label: 'Inactive Users',
    icon: faUserSlash,
    iconColor: 'text-gray-500',
    iconBg: 'bg-gray-100',
  },
  {
    key: 'unregistered',
    label: 'Unregistered Users',
    icon: faUserClock,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50',
  },
]

function StatCards({ counts }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon, iconColor, iconBg }) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900">{counts[key]}</p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            <FontAwesomeIcon icon={icon} className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatCards
