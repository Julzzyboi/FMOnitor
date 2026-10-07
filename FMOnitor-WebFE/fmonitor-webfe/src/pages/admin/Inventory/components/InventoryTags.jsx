import { CONDITION_STYLES, FALLBACK_CONDITION_STYLE } from '../utils/conditionStyles'

export function ConditionTag({ condition, className = '' }) {
  const style = CONDITION_STYLES[condition] ?? FALLBACK_CONDITION_STYLE
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${style.tag} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {condition}
    </span>
  )
}

export function AvailabilityTag({ availability, className = '' }) {
  const borrowable = availability === 'Borrowable'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        borrowable ? 'bg-[#fccb35] text-gray-900' : 'bg-gray-800 text-white'
      } ${className}`}
    >
      {availability}
    </span>
  )
}
