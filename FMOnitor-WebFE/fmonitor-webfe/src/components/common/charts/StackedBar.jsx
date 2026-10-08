import { useState } from 'react'

const pct = (value, total) => (total ? Math.round((value / total) * 100) : 0)

// One 100% bar split into segments, with a legend that repeats each value so
// the state is never carried by color alone. segments: [{ key, label, value, color }]
function StackedBar({ segments, unit = '', showLegend = true }) {
  const [hovered, setHovered] = useState(null)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const visible = segments.filter((s) => s.value > 0)
  const placed = visible.map((s, i) => ({
    ...s,
    start: (visible.slice(0, i).reduce((sum, prev) => sum + prev.value, 0) / total) * 100,
    width: (s.value / total) * 100,
  }))
  const active = placed.find((s) => s.key === hovered)

  return (
    <div>
      <div className="relative">
        <div
          role="img"
          aria-label={visible.map((s) => `${s.label}: ${s.value}${unit && ` ${unit}`}`).join(', ')}
          className="chart-grow-x flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100"
        >
          {placed.map((s) => (
            <div
              key={s.key}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              className="h-full cursor-default transition-opacity duration-150"
              style={{
                width: `${s.width}%`,
                backgroundColor: s.color,
                opacity: hovered && hovered !== s.key ? 0.35 : 1,
              }}
            />
          ))}
        </div>

        {active && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 animate-[dropdown-in_0.12s_ease-out] whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
            style={{ left: `${Math.min(85, Math.max(15, active.start + active.width / 2))}%` }}
          >
            <span className="font-semibold">{active.label}</span> · {active.value.toLocaleString()}
            {unit && ` ${unit}`} ({pct(active.value, total)}%)
          </div>
        )}
      </div>

      {showLegend && (
        <ul className="mt-4 flex flex-col gap-2.5">
          {segments.map((s) => (
            <li
              key={s.key}
              onMouseEnter={() => setHovered(s.key)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-2.5 rounded-md text-sm transition-opacity duration-150 ${
                hovered && hovered !== s.key ? 'opacity-50' : ''
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="flex-1 truncate text-gray-600">{s.label}</span>
              <span className="font-semibold tabular-nums text-gray-900">{s.value.toLocaleString()}</span>
              <span className="w-10 text-right text-xs tabular-nums text-gray-400">{pct(s.value, total)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default StackedBar
