import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FACILITY_TYPE_STYLES } from './rowStyles'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

// Deliberately not Mapbox's built-in Popup - this follows the app's own modal
// look (Accounts/UserDetailsModal.jsx) instead, for a consistent feel across pages.
function FacilityDetailsPanel({ facility, onClose }) {
  const style = FACILITY_TYPE_STYLES[facility.type] ?? FACILITY_TYPE_STYLES.Office

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-md animate-[fade-in-up_0.25s_ease-out_forwards] rounded-2xl bg-white p-6 opacity-0 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Facility Details</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full text-white ${style.bgClass}`}>
            <FontAwesomeIcon icon={style.icon} className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-gray-900">{facility.name}</p>
        </div>

        <div className="mt-6">
          <DetailRow label="Type" value={facility.type} />
          <DetailRow label="Latitude" value={facility.latitude} />
          <DetailRow label="Longitude" value={facility.longitude} />
        </div>
      </div>
    </div>
  )
}

export default FacilityDetailsPanel
