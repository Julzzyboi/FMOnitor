import { useState } from 'react'
import { BAR_COLOR, BAR_HIGHLIGHT } from '../../../constants/chartColors'

// Picks a round axis maximum (1, 2, 5 x 10^n) at or above the data's peak.
function niceMax(value) {
  if (value <= 4) return 4
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 5, 10].find((m) => m * magnitude >= value / 4) * magnitude
  return Math.ceil(value / step) * step
}

// Vertical columns over a recessive grid, with a per-column hover tooltip.
// data: [{ key, label, value, tooltip }]
function ColumnChart({ data, height = 200, unitLabel = '' }) {
  const [hovered, setHovered] = useState(null)
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)))
  const ticks = [max, max / 2, 0]

  return (
    <div className="flex gap-3" role="img" aria-label={data.map((d) => `${d.label}: ${d.value}`).join(', ')}>
      <div className="flex flex-col justify-between pb-6 text-right text-[10px] tabular-nums text-gray-400" style={{ height }}>
        {ticks.map((t) => (
          <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
            {Number.isInteger(t) ? t : t.toFixed(1)}
          </span>
        ))}
      </div>

      <div className="relative flex-1" style={{ height }}>
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between">
          {ticks.map((t) => (
            <div key={t} className={`border-t ${t === 0 ? 'border-gray-300' : 'border-dashed border-gray-100'}`} />
          ))}
        </div>

        <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-3">
          {data.map((d, i) => {
            const isHovered = hovered === d.key
            return (
              <div
                key={d.key}
                onMouseEnter={() => setHovered(d.key)}
                onMouseLeave={() => setHovered(null)}
                className="relative flex h-full flex-1 cursor-default flex-col items-center justify-end"
              >
                <div className="flex w-full flex-1 items-end justify-center pb-6">
                  <div
                    className="relative flex w-full max-w-10 justify-center"
                    style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 3 : 0 }}
                  >
                    {isHovered && (
                      <div className="pointer-events-none absolute bottom-full z-10 mb-2 animate-[dropdown-in_0.12s_ease-out] whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg">
                        <span className="font-semibold">{d.tooltip ?? d.label}</span> · {d.value} {unitLabel}
                      </div>
                    )}
                    <div
                      className="chart-grow-y h-full w-full rounded-t transition-colors duration-150"
                      style={{
                        backgroundColor: isHovered ? BAR_HIGHLIGHT : BAR_COLOR,
                        animationDelay: `${i * 40}ms`,
                      }}
                    />
                  </div>
                </div>
                {/* On phones, long series label every other column so labels don't collide. */}
                <span
                  className={`absolute bottom-0 whitespace-nowrap text-[10px] font-medium transition-colors ${
                    isHovered ? 'text-gray-900' : 'text-gray-400'
                  } ${data.length > 6 && i % 2 === 1 && !isHovered ? 'max-sm:invisible' : ''}`}
                >
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ColumnChart
