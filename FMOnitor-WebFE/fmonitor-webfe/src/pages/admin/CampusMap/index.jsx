import { useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLocationDot } from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import MapCanvas from './map/MapCanvas'
import MapLoadingOverlay from './map/MapLoadingOverlay'
import FilterNav from './panels/FilterNav'
import AddStorageModal from './modals/AddStorageModal'
import AddVenueModal from './modals/AddVenueModal'
import AddCampusAreaModal from './modals/AddCampusAreaModal'
import { CAMPUS_AREA_TYPES, FACILITY_TYPES } from './data/facilityTypes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const ENDPOINTS = { area: '/api/campus-facilities', storage: '/api/campus-storages', venue: '/api/campus-venues' }
const TYPE_TAG = { storage: 'Storage', venue: 'Venue' }

function belongsToKind(f, kind) {
  if (kind === 'storage') return f.type === 'Storage'
  if (kind === 'venue') return f.type === 'Venue'
  return CAMPUS_AREA_TYPES.includes(f.type)
}

function CampusMapContent() {
  const [campuses, setCampuses] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const [closeDetailsSignal, setCloseDetailsSignal] = useState(0)
  const [visibleTypes, setVisibleTypes] = useState(() => new Set(FACILITY_TYPES))
  const [placingKind, setPlacingKind] = useState(null)
  const [placingPresetAreaId, setPlacingPresetAreaId] = useState(null)
  const [pendingPlacement, setPendingPlacement] = useState(null)
  const [editingItem, setEditingItem] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/campus-branches`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE_URL}${ENDPOINTS.area}`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE_URL}${ENDPOINTS.venue}`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE_URL}${ENDPOINTS.storage}`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([branchData, facilityData, venueData, storageData]) => {
        setCampuses(branchData)
        setFacilities([
          ...facilityData,
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

  const startPlacing = (kind) => {
    setPlacingKind((prev) => (prev === kind ? null : kind))
    setPlacingPresetAreaId(null)
  }
  const startEmbeddedPlacing = (kind, areaId) => {
    setPlacingKind(kind)
    setPlacingPresetAreaId(areaId)
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-48px)] w-full lg:h-[calc(100vh-57px)]">
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
        placementMode={placingKind}
        placementFacilityId={placingKind && placingKind !== 'area' ? placingPresetAreaId : null}
        onMoveItem={(item, [lng, lat]) =>
          patchItem(item.type === 'Storage' ? 'storage' : item.type === 'Venue' ? 'venue' : 'area', item.id, {
            latitude: lat,
            longitude: lng,
          })
        }
        onCancelPlacement={() => {
          setPlacingKind(null)
          setPlacingPresetAreaId(null)
        }}
        onPlacementClick={(lngLat, detectedName, detectedShape) => {
          setPendingPlacement({ kind: placingKind, lngLat, presetCampusAreaId: placingPresetAreaId, detectedName, detectedShape })
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
          detectedShape={pendingPlacement.detectedShape}
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
