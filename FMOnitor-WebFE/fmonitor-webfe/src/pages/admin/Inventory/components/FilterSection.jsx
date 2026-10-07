import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck } from '@fortawesome/free-solid-svg-icons'

function Checkbox({ checked, round = false }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center transition-all duration-200 ${round ? 'rounded-full' : 'rounded-md'} ${
        checked ? 'bg-[#fccb35] shadow-sm shadow-[#fccb35]/50' : 'bg-gray-100 ring-1 ring-inset ring-gray-200 group-hover:ring-gray-300'
      }`}
    >
      <FontAwesomeIcon
        icon={faCheck}
        className={`h-2.5 w-2.5 text-gray-900 transition-all duration-200 ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
      />
    </span>
  )
}

function FilterOption({ label, checked, round, count, dotClass, onClick, role }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      onClick={onClick}
      title={label}
      className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors duration-150 ${
        checked ? 'bg-[#fccb35]/20 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Checkbox checked={checked} round={round} />
      {dotClass && <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="shrink-0 text-[11px] text-gray-400">{count}</span>}
    </button>
  )
}

// Multi-select: nothing ticked means "show everything".
export function FilterSection({ title, options, counts, visible, onToggle, dotClassFor }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="flex flex-col gap-0.5">
        {options.map((option) => (
          <FilterOption
            key={option}
            role="checkbox"
            label={option}
            checked={visible.has(option)}
            count={counts[option] ?? 0}
            dotClass={dotClassFor?.(option)}
            onClick={() => onToggle(option)}
          />
        ))}
      </div>
    </div>
  )
}

// Single-select, e.g. sort order. `options` is [[value, label], ...].
export function RadioSection({ title, options, value, onChange }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="flex flex-col gap-0.5" role="radiogroup">
        {options.map(([optionValue, label]) => (
          <FilterOption
            key={optionValue}
            role="radio"
            round
            label={label}
            checked={value === optionValue}
            onClick={() => onChange(optionValue)}
          />
        ))}
      </div>
    </div>
  )
}
