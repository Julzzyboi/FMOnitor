import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { CAMPUS_AREA_TYPES } from './rowStyles'
import PhotoFileInput from './PhotoFileInput'

// Same create-vs-edit split as AddStorageModal/AddVenueModal (`editItem`
// presence decides which), but for a campus area itself - name, type, and
// which campus map it belongs to (campusOptions is almost always a single
// entry today, but the form still lets you pick if there's ever more than
// one). Moving an existing area's pin isn't supported here either.
// `initialName` is whatever real building/POI Mapbox's own map data already
// had at the clicked point (see MapCanvas's detectPlaceNameAt) - pre-fills
// the field instead of leaving it blank, still fully editable.
function AddCampusAreaModal({ lngLat, campusOptions, editItem, initialName, onCancel, onSubmit }) {
  const isEdit = !!editItem
  const [name, setName] = useState(editItem?.name ?? initialName ?? '')
  const [type, setType] = useState(editItem?.type ?? CAMPUS_AREA_TYPES[0])
  const [campusId, setCampusId] = useState(editItem?.campusId ?? campusOptions[0]?.id ?? '')
  const [photoUrl, setPhotoUrl] = useState(editItem?.photoUrl ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim() || !type || (!isEdit && !campusId)) return
    setSubmitting(true)
    setError(null)
    const payload = {
      name: name.trim(),
      type,
      photoUrl,
    }
    if (!isEdit) {
      payload.campusId = Number(campusId)
      payload.latitude = lngLat[1]
      payload.longitude = lngLat[0]
    }
    const result = await onSubmit(payload)
    setSubmitting(false)
    if (!result?.ok) {
      setError(result?.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm animate-[fade-in-up_0.25s_ease-out_forwards] rounded-2xl bg-white p-6 opacity-0 shadow-2xl sm:p-8"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Campus Area' : 'Add Campus Area'}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
              placeholder="e.g. UST Main Building"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
            >
              {CAMPUS_AREA_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          {!isEdit && campusOptions.length > 1 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Campus</span>
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                required
                className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
              >
                {campusOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <PhotoFileInput value={photoUrl} onChange={setPhotoUrl} />

          {!isEdit && (
            <p className="text-xs text-gray-400">
              Location: {lngLat[1].toFixed(6)}, {lngLat[0].toFixed(6)}
            </p>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
        </div>

        <div className="mt-8 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || (!isEdit && campusOptions.length === 0)}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg bg-[#fccb35] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Area'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddCampusAreaModal
