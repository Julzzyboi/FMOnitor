import { Link } from 'react-router-dom'

const TONES = {
  brand: 'bg-[#fccb35]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-400',
  danger: 'bg-red-500',
  info: 'bg-sky-500',
  neutral: 'bg-gray-300',
}

// KPI tile: label, big number, one line of context. The dot carries the
// tile's state; it becomes a link when `to` is set.
function StatCard({ label, value, hint, tone = 'neutral', to }) {
  const body = (
    <>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONES[tone] ?? TONES.neutral}`} />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-gray-900">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-gray-500">{hint}</p>}
    </>
  )

  const className = 'block rounded-xl bg-white p-5 shadow-lg'

  if (!to) return <div className={className}>{body}</div>

  return (
    <Link
      to={to}
      className={`${className} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fccb35]`}
    >
      {body}
    </Link>
  )
}

export default StatCard
