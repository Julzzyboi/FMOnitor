import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

// Docked to the right edge of the map (not a floating callout tracking a
// screen point anymore) - can minimize to a thin icon strip or maximize to
// show full details, independent of the close button which dismisses the
// selection entirely. Layout still takes its header-banner-with-icon
// structure from the dashboard reference the user shared earlier.
//
// Only ever mounted while something's selected (see MapCanvas's `{selected
// && <DetailsSidebar>...}`) - clicking a different area clears the selection
// immediately (unmounting this instantly, no lingering) and only sets the
// new one once the camera's finished flying to it, which remounts this
// fresh and plays the slide-in entrance below for the new area.
function DetailsSidebar({ icon, accentColor, title, subtitle, minimized, onToggleMinimize, onClose, children }) {
  if (minimized) {
    return (
      <div className="absolute right-0 top-0 z-20 flex h-full w-14 animate-[slide-in-right_0.25s_ease-out_forwards] flex-col items-center gap-3 border-l border-gray-100 bg-white py-5 opacity-0 shadow-2xl">
        <button
          type="button"
          onClick={onToggleMinimize}
          aria-label="Maximize details"
          className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
        </button>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <FontAwesomeIcon icon={icon} className="h-4 w-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-80 animate-[slide-in-right_0.25s_ease-out_forwards] flex-col border-l border-gray-100 bg-white opacity-0 shadow-2xl">
      <div className="relative flex items-start gap-3 p-5" style={{ backgroundColor: `${accentColor}1a` }}>
        <div className="absolute right-3 top-3 flex gap-1">
          <button
            type="button"
            onClick={onToggleMinimize}
            aria-label="Minimize"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-black/5 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-black/5 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <FontAwesomeIcon icon={icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 pr-14 pt-1">
          <p className="truncate text-base font-bold text-gray-900">{title}</p>
          {subtitle && <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Details</p>
        {children}
      </div>
    </div>
  )
}

export default DetailsSidebar
