import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faImage, faPen, faTrash } from '@fortawesome/free-solid-svg-icons'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function EquipmentDetailsModal({ item, onClose, onEdit, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative flex max-h-full w-full max-w-md animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-gray-900">Equipment Details</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            {item.photoUrl ? (
              <img src={item.photoUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <FontAwesomeIcon icon={faImage} className="h-10 w-10 text-gray-300" />
            )}
          </div>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.location}</p>
          <p className="mt-0.5 text-lg font-bold text-gray-900">{item.name}</p>

          <div className="mt-3">
            <DetailRow label="Storage Area" value={item.location} />
            <DetailRow label="Available" value={item.available} />
            <DetailRow label="Not Working" value={item.notWorking} />
            <DetailRow label="Condition" value={item.condition} />
            <DetailRow label="Availability" value={item.availability} />
          </div>
        </div>

        <div className="flex shrink-0 gap-2.5 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fccb35] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f]"
          >
            <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

export default EquipmentDetailsModal
