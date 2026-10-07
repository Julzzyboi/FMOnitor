import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons'

export const MAP_THEME_MODES = ['auto', 'light', 'dark']
export const MAP_THEME_STORAGE_KEY = 'campusMapTheme'

const OPTIONS = [
  { mode: 'auto', icon: faCircleHalfStroke, label: 'Auto - light by day, dark at night' },
  { mode: 'light', icon: faSun, label: 'Light map' },
  { mode: 'dark', icon: faMoon, label: 'Dark map' },
]

function MapThemeToggle({ mode, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="Map theme"
      className="absolute left-2.5 top-[82px] z-10 flex flex-col overflow-hidden rounded-md bg-white shadow-[0_0_0_2px_rgba(0,0,0,0.1)]"
    >
      {OPTIONS.map((option) => {
        const active = option.mode === mode
        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.mode)}
            className={`flex h-[29px] w-[29px] cursor-pointer items-center justify-center border-b border-gray-100 transition-colors duration-150 last:border-0 ${
              active ? 'bg-[#fccb35] text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <FontAwesomeIcon icon={option.icon} className="h-3.5 w-3.5" />
          </button>
        )
      })}
    </div>
  )
}

export default MapThemeToggle
