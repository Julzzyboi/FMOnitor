import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faChevronDown,
  faPlus,
  faMinus,
  faArrowsUpDownLeftRight,
  faHandPointer,
  faLocationDot,
  faMapLocationDot,
  faFont,
} from '@fortawesome/free-solid-svg-icons'
import { FACILITY_TYPES, FACILITY_TYPE_STYLES } from './rowStyles'

const NAV_ITEMS = [
  {
    icon: faPlus,
    extra: faMinus,
    label: 'Zoom in / out',
    hint: 'Top-left +/−, or scroll',
  },
  {
    icon: faArrowsUpDownLeftRight,
    label: 'Pan the map',
    hint: 'Click and drag',
  },
  {
    icon: faHandPointer,
    label: 'Open a location',
    hint: 'Click a campus-area pin',
  },
  {
    icon: faLocationDot,
    label: 'Filters & tickets',
    hint: 'Yellow button, bottom-right',
  },
  {
    icon: faMapLocationDot,
    label: 'Add an area',
    hint: 'Filters panel, then click the map',
  },
  {
    icon: faFont,
    label: 'Pin names',
    hint: 'Appear when zoomed in close',
  },
]

function LegendPin({ type }) {
  const style = FACILITY_TYPE_STYLES[type]
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-white shadow-sm ${style.bgClass}`}
    >
      <FontAwesomeIcon icon={style.icon} className="h-3 w-3" />
    </span>
  )
}

// Bottom-left so it never sits under Mapbox zoom (top-left), the filter FAB
// (bottom-right), or the details sidebar (right edge). Raised off the
// Mapbox logo with bottom-12. Collapsed by default so the map stays the
// focus; the same pin glyphs as MapCanvas so the guide matches the canvas.
function MapLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="pointer-events-auto absolute bottom-12 left-3 z-20 w-72 max-w-[calc(100%-1.5rem)]">
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBookOpen} className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">Map legend</span>
          </span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="max-h-[min(60vh,28rem)] overflow-y-auto border-t border-gray-100 px-3.5 pb-3.5 pt-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Icons</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              {FACILITY_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <LegendPin type={type} />
                  <span className="min-w-0 truncate text-xs font-medium text-gray-700">{type}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-gray-400">
              Campus-area pins (buildings, gates, fields, and the rest) open details when clicked.
              Venue and Storage pins sit inside an area and are not clickable on their own.
            </p>

            <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              Navigation
            </p>
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.label} className="flex items-start gap-2.5 rounded-lg px-1 py-1">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                    {item.extra ? (
                      <span className="flex items-center gap-0.5 text-[9px]">
                        <FontAwesomeIcon icon={item.icon} className="h-2.5 w-2.5" />
                        <FontAwesomeIcon icon={item.extra} className="h-2.5 w-2.5" />
                      </span>
                    ) : (
                      <FontAwesomeIcon icon={item.icon} className="h-3 w-3" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.hint}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2.5 rounded-lg px-1 py-1">
              <span className="h-3 w-6 shrink-0 rounded-sm border-2 border-[#fccb35] bg-[#fccb35]/20" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800">Campus boundary</p>
                <p className="text-[11px] text-gray-400">Gold outline; outside campus is dimmed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapLegend
