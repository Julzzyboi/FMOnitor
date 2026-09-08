import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import PhotoFileInput from './PhotoFileInput'

// Mirrors AddStorageModal exactly - a venue is embedded in a campus area the
// same way a storage area is, just its own dedicated table/type. `editItem`
// presence means edit mode: no map click/location needed, moving an existing
// venue's position isn't supported here. `presetCampusAreaId` is set when
// this was armed from inside an already-selected area's sidebar (its own
// "+ Add Venue" button) - the area's already known then, so the dropdown
// below is replaced with a fixed label instead of asking again. `initialName`
// is whatever real building/POI Mapbox's own map data already had at the
// clicked point (see MapCanvas's detectPlaceNameAt) - pre-fills the field
// instead of leaving it blank, still fully editable.
function AddVenueModal({ lngLat, campusAreaOptions, editItem, presetCampusAreaId, initialName, onCancel, onSubmit }) {
  const isEdit = !!editItem
  const fixedArea = !isEdit && presetCampusAreaId != null
  const [name, setName] = useState(editItem?.name ?? initialName ?? '')
  const [campusAreaId, setCampusAreaId] = useState(
    editItem?.campusAreaId ?? presetCampusAreaId ?? campusAreaOptions[0]?.id ?? '',
  )
  const [photoUrl, setPhotoUrl] = useState(editItem?.photoUrl ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim() || !campusAreaId) return
    setSubmitting(true)
    setError(null)
    const payload = {
      name: name.trim(),
      campusAreaId: Number(campusAreaId),
      photoUrl,
    }
    if (!isEdit) {
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
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Venue' : 'Add Venue'}</h3>
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
              placeholder="e.g. Main Auditorium"
            />
          </label>

          {fixedArea ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Embedded in Campus Area
              </span>
              <p className="rounded-lg bg-gray-50 px-3.5 py-2.5 text-sm font-semibold text-gray-700">
                {campusAreaOptions.find((a) => a.id === presetCampusAreaId)?.name ?? `Area ${presetCampusAreaId}`}
              </p>
            </div>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Embedded in Campus Area
              </span>
              <select
                value={campusAreaId}
                onChange={(e) => setCampusAreaId(e.target.value)}
                required
                className="rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
              >
                {campusAreaOptions.length === 0 && <option value="">No campus areas exist yet</option>}
                {campusAreaOptions.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} (ID {area.id})
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
            disabled={submitting || (!isEdit && campusAreaOptions.length === 0)}
            className="flex flex-1 cursor-pointer items-center justify-center rounded-lg bg-[#fccb35] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Venue'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddVenueModal
