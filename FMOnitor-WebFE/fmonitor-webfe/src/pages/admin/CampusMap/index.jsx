import { useCallback, useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faBuilding } from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import MapCanvas from './MapCanvas'
import FacilityDetailsPanel from './FacilityDetailsPanel'
import CampusDetailsPanel from './CampusDetailsPanel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

function CampusMapContent() {
  const [campuses, setCampuses] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [selectedCampus, setSelectedCampus] = useState(null)
  // Default to campus-only, no building markers - MapCanvas already clears and
  // rebuilds its markers on every prop change, so "hide buildings" is just
  // "pass it an empty array" rather than needing any logic of its own there.
  const [showFacilities, setShowFacilities] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/campuses`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${API_BASE_URL}/api/facilities`, { credentials: 'include' }).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([campusData, facilityData]) => {
        setCampuses(campusData)
        setFacilities(facilityData)
      })
      .catch(() => {
        setCampuses([])
        setFacilities([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Stable identity so MapCanvas's marker-rebuilding effect doesn't re-run on
  // every CampusMapContent render, only when the data it actually depends on changes.
  const handleSelectFacility = useCallback((facility) => setSelectedFacility(facility), [])
  const handleSelectCampus = useCallback((campus) => setSelectedCampus(campus), [])

  // Only the map itself goes full-bleed to the topbar/sidebar edges - these
  // fallback states keep normal page padding, matching every other page.
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center p-4 sm:p-6 lg:p-8">
        <FontAwesomeIcon icon={faSpinner} className="h-8 w-8 animate-spin text-gray-300" />
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
        onClick={() => setShowFacilities((v) => !v)}
        className={`absolute right-4 top-4 z-10 flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-bold uppercase tracking-wide shadow-sm transition-colors duration-150 ${
          showFacilities
            ? 'border-[#fccb35] bg-[#fccb35] text-gray-900'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <FontAwesomeIcon icon={faBuilding} className="h-3.5 w-3.5" />
        {showFacilities ? 'Showing Buildings' : 'Show Buildings'}
      </button>

      <MapCanvas
        campuses={campuses}
        facilities={showFacilities ? facilities : []}
        onSelectFacility={handleSelectFacility}
        onSelectCampus={handleSelectCampus}
      />
      {selectedFacility && (
        <FacilityDetailsPanel facility={selectedFacility} onClose={() => setSelectedFacility(null)} />
      )}
      {selectedCampus && (
        <CampusDetailsPanel campus={selectedCampus} onClose={() => setSelectedCampus(null)} />
      )}
    </div>
  )
}

function CampusMap() {
  return (
    <AdminPageShell fullBleed>
      <CampusMapContent />
    </AdminPageShell>
  )
}

export default CampusMap
