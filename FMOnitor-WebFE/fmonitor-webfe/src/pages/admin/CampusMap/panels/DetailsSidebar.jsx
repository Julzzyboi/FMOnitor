import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

function DetailsSidebar({ title, minimized, onToggleMinimize, onClose, children }) {
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
      </div>
    )
  }

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-80 animate-[slide-in-right_0.25s_ease-out_forwards] flex-col border-l border-gray-100 bg-white opacity-0 shadow-2xl">
      <div className="relative flex items-center justify-between border-b border-gray-100 p-5">
        <p className="break-words pr-16 text-base font-bold text-gray-900">{title}</p>
        <div className="absolute right-3 top-3 flex gap-1">
          <button
            type="button"
            onClick={onToggleMinimize}
            aria-label="Minimize"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-4">{children}</div>
    </div>
  )
}

export default DetailsSidebar
