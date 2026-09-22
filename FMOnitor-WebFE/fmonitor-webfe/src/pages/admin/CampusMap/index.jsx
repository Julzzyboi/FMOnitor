import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot } from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import MapCanvas from './MapCanvas'
import MapLoadingOverlay from './MapLoadingOverlay'
import FilterNav from './FilterNav'
import AddStorageModal from './AddStorageModal'
import AddVenueModal from './AddVenueModal'
import AddCampusAreaModal from './AddCampusAreaModal'
import { CAMPUS_AREA_TYPES, FACILITY_TYPES } from './rowStyles'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Which backend endpoint/table each "kind" of add-or-edit target maps to -
// used by the generic postItem/patchItem/deleteItemByKind helpers below so
// there's one copy of the fetch plumbing instead of three near-identical ones.
const ENDPOINTS = { area: '/api/campus-areas', storage: '/api/storage', venue: '/api/venues' }
// Storage/Venue rows don't carry their own `type` column server-side (unlike
// CampusAreas, which does) - this is what tags them the same way the initial
// fetch already does, so the rest of this folder can keep reading
// `facility.type` generically.
const TYPE_TAG = { storage: 'Storage', venue: 'Venue' }

// Which existing `facilities` entries a given kind's id could possibly refer
// to - ids aren't unique ACROSS tables, just within each one, so replacing/
// removing an entry after an edit/delete has to check both id and kind.
function belongsToKind(f, kind) {
  if (kind === 'storage') return f.type === 'Storage'
  if (kind === 'venue') return f.type === 'Venue'
  return CAMPUS_AREA_TYPES.includes(f.type)
}

function CampusMapContent() {
  const [campuses, setCampuses] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  // Right-docked filter nav - closed by default, toggled by the floating
  // location-pin button (see the bottom of this component's JSX). Only one
  // of {this nav, MapCanvas's own details sidebar} is ever open at once -
  // both dock to the same right edge, so showing both together read as a
  // confusing "double navigation". Opening this one signals MapCanvas to
  // close its selection (closeDetailsSignal); MapCanvas selecting something
  // closes this one back (onSelectionActiveChange).
  const [navOpen, setNavOpen] = useState(false)
  const [closeDetailsSignal, setCloseDetailsSignal] = useState(0)
  // Filters by facility TYPE (Building/Field/Grandstand/.../Venue/Storage),
  // same as the original dropdown - not per individual facility. Everything
  // visible by default, narrowed down by unchecking a type.
  const [visibleTypes, setVisibleTypes] = useState(() => new Set(FACILITY_TYPES))
  // Add flow: click one of the three "Add ___" buttons (either the toolbar's
  // own, or a "+ Add Storage/Venue" button inside a selected area's sidebar -
  // see onAddEmbeddedItem below) to arm placement mode for that kind, click
  // the map to capture a point (handled inside MapCanvas - see
  // placementMode/onPlacementClick), then the matching modal opens with that
  // point already set. Only one kind can be armed at a time.
  const [placingKind, setPlacingKind] = useState(null)
  // Set only by the sidebar's embedded add flow - the area a new storage/
  // venue is being added into is already known then, so the modal skips
  // asking and just uses this directly instead of showing its dropdown.
  const [placingPresetAreaId, setPlacingPresetAreaId] = useState(null)
  const [pendingPlacement, setPendingPlacement] = useState(null)
  // Edit flow: opened from AreaDetailsContent (via MapCanvas's onEditArea/
  // onEditItem props) with the row already loaded - no map click involved.
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    // Four separate backend sources now: tbl_campus_maps (the boundary
    // polygon, renamed from the old tbl_campuses), tbl_campus_areas (the 45
    // general UST locations, each with its own real type), tbl_venues, and
    // tbl_storage (their own dedicated tables). CampusAreas already carries
    // its own `type`; venues/storage get one tagged on here as they come in -
    // either way, the rest of this folder's rendering code (MapCanvas,
    // rowStyles, the details panel) just reads `facility.type` generically
    // and never needs to know which endpoint a given row actually came from.
    Promise.all([
      fetch(`${API_BASE_URL}/api/campus-maps`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE_URL}/api/campus-areas`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE_URL}/api/venues`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE_URL}/api/storage`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([campusMapData, campusAreaData, venueData, storageData]) => {
        setCampuses(campusMapData)
        setFacilities([
          ...campusAreaData,
          ...venueData.map((v) => ({ ...v, type: 'Venue' })),
          ...storageData.map((s) => ({ ...s, type: 'Storage' })),
        ])
      })
      .catch(() => {
        setCampuses([])
        setFacilities([])
      })
      .finally(() => setLoading(false))
  }, [])

  const visibleFacilities = useMemo(
    () => facilities.filter((f) => visibleTypes.has(f.type)),
    [facilities, visibleTypes],
  )

  // Only real campus areas (Building/Gate/Field/etc.) are valid "embedded in"
  // targets for a new storage area or venue - not other venues or storage rows.
  const campusAreaOptions = useMemo(
    () => facilities.filter((f) => CAMPUS_AREA_TYPES.includes(f.type)).map((f) => ({ id: f.id, name: f.name })),
    [facilities],
  )
  const campusOptions = useMemo(() => campuses.map((c) => ({ id: c.id, name: c.name })), [campuses])

  const toggleType = (type) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }
  const selectAllTypes = () => setVisibleTypes(new Set(FACILITY_TYPES))
  const clearAllTypes = () => setVisibleTypes(new Set())

  const postItem = async (kind, payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}${ENDPOINTS[kind]}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        return { ok: false, message: body?.message || 'Failed to save.' }
      }
      const saved = await res.json()
      setFacilities((prev) => [...prev, TYPE_TAG[kind] ? { ...saved, type: TYPE_TAG[kind] } : saved])
      return { ok: true }
    } catch {
      return { ok: false, message: 'Network error - please try again.' }
    }
  }

  const patchItem = async (kind, id, payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}${ENDPOINTS[kind]}/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        return { ok: false, message: body?.message || 'Failed to save changes.' }
      }
      const saved = await res.json()
      const tagged = TYPE_TAG[kind] ? { ...saved, type: TYPE_TAG[kind] } : saved
      setFacilities((prev) => prev.map((f) => (f.id === id && belongsToKind(f, kind) ? tagged : f)))
      return { ok: true }
    } catch {
      return { ok: false, message: 'Network error - please try again.' }
    }
  }

  const deleteItemByKind = async (kind, id) => {
    try {
      const res = await fetch(`${API_BASE_URL}${ENDPOINTS[kind]}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        return { ok: false, message: body?.message || 'Failed to delete.' }
      }
      setFacilities((prev) => prev.filter((f) => !(f.id === id && belongsToKind(f, kind))))
      return { ok: true }
    } catch {
      return { ok: false, message: 'Network error - please try again.' }
    }
  }

  const handlePlacementSubmit = async (kind, payload) => {
    const result = await postItem(kind, payload)
    if (result.ok) setPendingPlacement(null)
    return result
  }
  const handleEditSubmit = async (kind, id, payload) => {
    const result = await patchItem(kind, id, payload)
    if (result.ok) setEditingItem(null)
    return result
  }

  // Toolbar buttons: toggle on/off, no area preset - which area it's
  // embedded in (for storage/venue) gets picked via the modal's own dropdown.
  const startPlacing = (kind) => {
    setPlacingKind((prev) => (prev === kind ? null : kind))
    setPlacingPresetAreaId(null)
  }
  // Sidebar's "+ Add Storage/Venue" buttons (see MapCanvas's onAddEmbeddedItem
  // prop): always arms fresh rather than toggling, and locks in which area
  // it's embedded into up front, since that's already known here.
  const startEmbeddedPlacing = (kind, areaId) => {
    setPlacingKind(kind)
    setPlacingPresetAreaId(areaId)
  }

  // Same full-bleed footprint the real map will occupy once loaded (see the
  // MapCanvas wrapper below) - keeps this from being a smaller centered box
  // that then jumps/resizes into the full map area once data arrives.
  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] w-full lg:h-[calc(100vh-80px)]">
        <MapLoadingOverlay label="Loading campus map…" />
      </div>
    )
  }

  if (!import.meta.env.VITE_MAPBOX_TOKEN) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          No Mapbox token configured. Add{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5">VITE_MAPBOX_TOKEN</code> to your{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5">.env</code> file and restart the dev server.
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Floating toggle - fixed in the same spot regardless of the nav's own
          open/closed state (a FAB, not something that slides with the panel),
          so it's always reachable. Sits above the details sidebar (z-20) too
          - toggling the filter nav should work even while something's
          selected, even though the nav itself is then hidden behind it
          (both dock to the same right edge; the sidebar wins on top). */}
      <button
        type="button"
        onClick={() =>
          setNavOpen((v) => {
            const next = !v
            if (next) setCloseDetailsSignal((n) => n + 1)
            return next
          })
        }
        aria-label={navOpen ? 'Close filters' : 'Open filters'}
        className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 ${
          navOpen ? 'bg-gray-900 text-white' : 'bg-[#fccb35] text-gray-900'
        }`}
      >
        <FontAwesomeIcon icon={faLocationDot} className="h-5 w-5" />
      </button>

      <FilterNav
        open={navOpen}
        visibleTypes={visibleTypes}
        onToggleType={toggleType}
        onSelectAll={selectAllTypes}
        onClearAll={clearAllTypes}
        onAddArea={() => startPlacing('area')}
        placingArea={placingKind === 'area'}
      />

      <MapCanvas
        campuses={campuses}
        facilities={visibleFacilities}
        allFacilities={facilities}
        placementMode={!!placingKind}
        onPlacementClick={(lngLat, detectedName) => {
          setPendingPlacement({ kind: placingKind, lngLat, presetCampusAreaId: placingPresetAreaId, detectedName })
          setPlacingKind(null)
          setPlacingPresetAreaId(null)
        }}
        onEditArea={(area) => setEditingItem({ kind: 'area', data: area })}
        onDeleteArea={(id) => deleteItemByKind('area', id)}
        onEditItem={(item) => setEditingItem({ kind: item.type === 'Storage' ? 'storage' : 'venue', data: item })}
        onDeleteItem={(item) => deleteItemByKind(item.type === 'Storage' ? 'storage' : 'venue', item.id)}
        onAddEmbeddedItem={startEmbeddedPlacing}
        onSelectionActiveChange={(active) => {
          if (active) setNavOpen(false)
        }}
        closeSignal={closeDetailsSignal}
      />

      {pendingPlacement?.kind === 'area' && (
        <AddCampusAreaModal
          lngLat={pendingPlacement.lngLat}
          campusOptions={campusOptions}
          initialName={pendingPlacement.detectedName}
          onCancel={() => setPendingPlacement(null)}
          onSubmit={(payload) => handlePlacementSubmit('area', payload)}
        />
      )}
      {pendingPlacement?.kind === 'venue' && (
        <AddVenueModal
          lngLat={pendingPlacement.lngLat}
          campusAreaOptions={campusAreaOptions}
          presetCampusAreaId={pendingPlacement.presetCampusAreaId}
          initialName={pendingPlacement.detectedName}
          onCancel={() => setPendingPlacement(null)}
          onSubmit={(payload) => handlePlacementSubmit('venue', payload)}
        />
      )}
      {pendingPlacement?.kind === 'storage' && (
        <AddStorageModal
          lngLat={pendingPlacement.lngLat}
          campusAreaOptions={campusAreaOptions}
          presetCampusAreaId={pendingPlacement.presetCampusAreaId}
          initialName={pendingPlacement.detectedName}
          onCancel={() => setPendingPlacement(null)}
          onSubmit={(payload) => handlePlacementSubmit('storage', payload)}
        />
      )}

      {editingItem?.kind === 'area' && (
        <AddCampusAreaModal
          editItem={editingItem.data}
          campusOptions={campusOptions}
          onCancel={() => setEditingItem(null)}
          onSubmit={(payload) => handleEditSubmit('area', editingItem.data.id, payload)}
        />
      )}
      {editingItem?.kind === 'venue' && (
        <AddVenueModal
          editItem={editingItem.data}
          campusAreaOptions={campusAreaOptions}
          onCancel={() => setEditingItem(null)}
          onSubmit={(payload) => handleEditSubmit('venue', editingItem.data.id, payload)}
        />
      )}
      {editingItem?.kind === 'storage' && (
        <AddStorageModal
          editItem={editingItem.data}
          campusAreaOptions={campusAreaOptions}
          onCancel={() => setEditingItem(null)}
          onSubmit={(payload) => handleEditSubmit('storage', editingItem.data.id, payload)}
        />
      )}
    </div>
  )
}

function CampusMap() {
  return (
    <AdminPageShell fullBleed skipSkeleton>
      <CampusMapContent />
    </AdminPageShell>
  )
}

export default CampusMap
