import { useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation, faSpinner } from '@fortawesome/free-solid-svg-icons'

// Deleting a storage that still holds inventory: the admin must either move
// the items to another storage or delete them along with it.
// `itemCount` is null while it's still loading.
function DeleteStorageModal({ storage, itemCount, trashedCount = 0, otherStorages, onCancel, onConfirm }) {
  const [action, setAction] = useState('transfer')
  const [targetId, setTargetId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const loading = itemCount === null
  const hasItems = itemCount > 0
  const canTransfer = otherStorages.length > 0
  const effectiveAction = hasItems && !canTransfer ? 'delete' : action

  const handleConfirm = async () => {
    if (hasItems && effectiveAction === 'transfer' && !targetId) {
      setError('Pick the storage to move the items to.')
      return
    }
    setSubmitting(true)
    setError(null)
    const options = !hasItems
      ? undefined
      : effectiveAction === 'transfer'
        ? { inventoryAction: 'transfer', transferToStorageId: Number(targetId) }
        : { inventoryAction: 'delete' }
    const result = await onConfirm(options)
    if (!result?.ok) {
      setError(result?.message || 'Failed to delete this storage.')
      setSubmitting(false)
    }
  }

  const plural = itemCount === 1 ? 'item' : 'items'

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-sm animate-[fade-in-up_0.2s_ease-out_forwards] rounded-2xl bg-white p-6 opacity-0 shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5 text-red-600" />
        </div>

        <h3 className="mt-4 text-center text-base font-bold text-gray-900">Delete {storage.name}?</h3>

        {loading ? (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-400">
            <FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 animate-spin" />
            Checking its inventory…
          </p>
        ) : !hasItems ? (
          <p className="mt-1.5 text-center text-sm text-gray-500">No inventory is kept here. This can't be undone.</p>
        ) : (
          <>
            <p className="mt-1.5 text-center text-sm text-gray-500">
              {itemCount} inventory {plural} {itemCount === 1 ? 'is' : 'are'} still kept here
              {trashedCount > 0 && ` (${trashedCount} of them in the trash bin)`}. What should happen to{' '}
              {itemCount === 1 ? 'it' : 'them'}?
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <label
                className={`flex gap-3 rounded-xl border p-3 text-left ${
                  !canTransfer ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${effectiveAction === 'transfer' ? 'border-[#fccb35] bg-[#fccb35]/10' : 'border-gray-200'}`}
              >
                <input
                  type="radio"
                  name="inventory-action"
                  checked={effectiveAction === 'transfer'}
                  disabled={!canTransfer}
                  onChange={() => setAction('transfer')}
                  className="mt-0.5 accent-[#e6b82f]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">Move them to another storage</span>
                  {canTransfer ? (
                    effectiveAction === 'transfer' && (
                      <select
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
                      >
                        <option value="">Select a storage…</option>
                        {otherStorages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    )
                  ) : (
                    <span className="block text-xs text-gray-500">There's no other storage to move them to.</span>
                  )}
                </span>
              </label>

              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-left ${
                  effectiveAction === 'delete' ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="inventory-action"
                  checked={effectiveAction === 'delete'}
                  onChange={() => setAction('delete')}
                  className="mt-0.5 accent-red-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">Delete them too</span>
                  <span className="block text-xs text-gray-500">
                    All {itemCount} {plural} and their reports are removed for good.
                  </span>
                </span>
              </label>
            </div>
          </>
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}

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
            disabled={loading || submitting}
            className="flex-1 cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Deleting…' : hasItems && effectiveAction === 'transfer' ? 'Move & Delete' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default DeleteStorageModal
