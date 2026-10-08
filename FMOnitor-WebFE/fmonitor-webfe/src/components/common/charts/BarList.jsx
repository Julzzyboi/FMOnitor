import { useState } from 'react'
import { BAR_COLOR, BAR_HIGHLIGHT } from '../../../constants/chartColors'

// Ranked horizontal bars, one series, each value labelled at the row's end.
// rows: [{ label, value }]
function BarList({ rows, unit = '' }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(1, ...rows.map((r) => r.value))
  const total = rows.reduce((sum, r) => sum + r.value, 0)

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <li
          key={row.label}
          onMouseEnter={() => setHovered(row.label)}
          onMouseLeave={() => setHovered(null)}
          title={`${row.label}: ${row.value.toLocaleString()}${unit && ` ${unit}`} (${total ? Math.round((row.value / total) * 100) : 0}%)`}
          className="cursor-default"
        >
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium text-gray-600">{row.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900">{row.value.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="chart-grow-x h-full rounded-full transition-colors duration-150"
              style={{
                width: `${(row.value / max) * 100}%`,
                backgroundColor: hovered === row.label ? BAR_HIGHLIGHT : BAR_COLOR,
                animationDelay: `${i * 50}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export default BarList
