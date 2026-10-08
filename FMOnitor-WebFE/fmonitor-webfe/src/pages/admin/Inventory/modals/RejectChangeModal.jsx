import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

const REASON_MAX = 500

// Rejecting an Admin's change; the optional reason is sent to them in their
// notification.
function RejectChangeModal({ request, onCancel, onConfirm }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    const ok = await onConfirm(reason.trim())
    if (!ok) setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-sm animate-[fade-in-up_0.2s_ease-out_forwards] rounded-2xl bg-white p-6 opacity-0 shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <FontAwesomeIcon icon={faXmark} className="h-5 w-5 text-red-600" />
        </div>
        <h3 className="mt-4 text-center text-base font-bold text-gray-900">Reject this change?</h3>
        <p className="mt-1.5 text-center text-sm text-gray-500">
          Nothing in the inventory will change. {request.requestedByName} will be notified.
        </p>

        <label className="mt-4 flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Reason (optional)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={REASON_MAX}
            autoFocus
            placeholder="e.g. Wrong storage - these chairs are at Qpav, not Grandstand"
            className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
          />
        </label>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RejectChangeModal
