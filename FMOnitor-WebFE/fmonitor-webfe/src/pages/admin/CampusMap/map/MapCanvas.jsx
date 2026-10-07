import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { icon } from '@fortawesome/fontawesome-svg-core'
import { FACILITY_TYPE_STYLES, CAMPUS_AREA_TYPES } from '../data/facilityTypes'
import DetailsSidebar from '../panels/DetailsSidebar'
import AreaDetailsContent from '../panels/AreaDetailsContent'
import MapLoadingOverlay from './MapLoadingOverlay'
import MapLegend from './MapLegend'
import MapThemeToggle, { MAP_THEME_MODES, MAP_THEME_STORAGE_KEY } from './MapThemeToggle'
import { generateTrees, treesToGeoJSON, ringContains } from '../utils/trees'
import {
  FACILITY_GEOFENCE_MARGIN_M,
  campusGridAngle,
  facilityGeofenceRing,
  facilityOutline,
  isWithinFacilityGeofence,
} from '../utils/geofence'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const DEFAULT_CENTER = [120.9894, 14.6091]
const DEFAULT_ZOOM = 20

const MAP_STYLE = import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/standard'

const OVERRIDE_LAYER_ID = 'facility-buildings-extrusion'
const CAMPUS_BUILDINGS_LAYER_ID = 'campus-buildings-extrusion'
const GEOFENCE_FILL_LAYER_ID = 'placement-geofence-fill'
const GEOFENCE_EDGE_LAYER_ID = 'placement-geofence-edge'
const basemapBuildingHsla = (i) => ['at', i, ['to-hsla', ['config', 'colorBuildings', 'basemap']]]
const CAMPUS_BUILDING_PAINT = {
  'fill-extrusion-color': [
    'hsl',
    ['max', 0, ['-', basemapBuildingHsla(0), 10]],
    ['min', 100, ['+', basemapBuildingHsla(1), 10]],
    basemapBuildingHsla(2),
  ],
  'fill-extrusion-height': ['get', 'height'],
  'fill-extrusion-base': ['coalesce', ['get', 'base'], 0],
  'fill-extrusion-opacity': 1,
  'fill-extrusion-ambient-occlusion-intensity': 0.15,
  'fill-extrusion-ambient-occlusion-ground-radius': ['interpolate', ['linear'], ['zoom'], 17, 0, 17.8, 8],
  'fill-extrusion-flood-light-color': 'hsl(30, 79%, 81%)',
  'fill-extrusion-flood-light-intensity': ['interpolate', ['linear'], ['measure-light', 'brightness'], 0.015, 0.3, 0.026, 0],
  'fill-extrusion-cast-shadows': false,
}

function insetRing(coords, factor) {
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2
  return coords.map(([lng, lat]) => [
    centerLng + (lng - centerLng) * (1 - factor),
    centerLat + (lat - centerLat) * (1 - factor),
  ])
}

function facilityFootprintFeature(facility) {
  if (!facility.heightOverride) return null
  let ring
  try {
    ring = closeRing(JSON.parse(facility.footprintJson))
  } catch {
    return null
  }
  if (ring.length < 4) return null
  return {
    type: 'Feature',
    properties: { height: facility.height },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

function featureContains(geometry, lng, lat) {
  if (!geometry) return false
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : []
  return polygons.some(([outer, ...holes]) => outer && ringContains(outer, lng, lat) && !holes.some((h) => ringContains(h, lng, lat)))
}

function detectBuildingShapeAt(map, point, lng, lat) {
  const r = 24
  const features = map.queryRenderedFeatures([[point.x - r, point.y - r], [point.x + r, point.y + r]])
  let best = null
  for (const feature of features) {
    const height = feature.properties?.height ?? feature.properties?.render_height
    if (typeof height !== 'number' || (best && height <= best.height)) continue
    const { geometry } = feature
    const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : []
    const hit = polygons.find(([outer, ...holes]) => outer && ringContains(outer, lng, lat) && !holes.some((h) => ringContains(h, lng, lat)))
    if (hit) best = { height, footprint: hit[0] }
  }
  return best
}

function markerAltitude(facility) {
  if (facility.type === 'Storage' || facility.type === 'Venue') {
    const ring = facilityOutline(facility)
    if (ring && !ringContains(ring, facility.longitude, facility.latitude)) return 0
  }
  return facility.height ?? 0
}

function placementPointOnFacility(map, e, facility) {
  const height = facility.height ?? 0
  if (height > 0) {
    const roof = map.unproject(e.point, height)
    const layers = [CAMPUS_BUILDINGS_LAYER_ID, OVERRIDE_LAYER_ID].filter((id) => map.getLayer(id))
    const hitBuilding = layers.length > 0 && map.queryRenderedFeatures(e.point, { layers }).some((f) => featureContains(f.geometry, roof.lng, roof.lat))
    const ring = facilityOutline(facility)
    if (hitBuilding && ring && ringContains(ring, roof.lng, roof.lat)) return roof
  }
  return e.lngLat
}

function closeRing(coords) {
  if (coords.length === 0) return coords
  const [firstLng, firstLat] = coords[0]
  const [lastLng, lastLat] = coords[coords.length - 1]
  return firstLng === lastLng && firstLat === lastLat ? coords : [...coords, coords[0]]
}

const WORLD_RING = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
]

const OUTSIDE_CAMPUS_COLOR = '#4b4b4b'
const BASEMAP_BUILDINGS = { featuresetId: 'buildings', importId: 'basemap' }
const BASEMAP_BUILDING_SOURCE = 'composite'

function loadedBasemapBuildings(map) {
  try {
    return map.style.getFragmentStyle('basemap').querySourceFeatures(BASEMAP_BUILDING_SOURCE, { sourceLayer: 'building' })
  } catch {
    try {
      return map.queryRenderedFeatures({ target: BASEMAP_BUILDINGS })
    } catch {
      return []
    }
  }
}

function campusRings(campuses) {
  const rings = []
  for (const campus of campuses) {
    try {
      const ring = closeRing(JSON.parse(campus.boundaryJson))
      if (ring.length >= 4) rings.push(ring)
    } catch {}
  }
  return rings
}

function groundLayerBefore(map) {
  return map.getLayer(CAMPUS_BUILDINGS_LAYER_ID) ? CAMPUS_BUILDINGS_LAYER_ID : undefined
}

function campusGroundLayerBefore(map) {
  return map.getLayer(GEOFENCE_FILL_LAYER_ID) ? GEOFENCE_FILL_LAYER_ID : groundLayerBefore(map)
}

function outerRings(geometry) {
  if (geometry?.type === 'Polygon') return [geometry.coordinates[0]]
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates.map((polygon) => polygon[0])
  return []
}

function campusBuildingFeatures(features, rings, skipPins) {
  const maxZoom = Math.max(...features.map((f) => f._z ?? 0))
  const pieces = new Map()
  for (const feature of features) {
    if ((feature._z ?? 0) !== maxZoom || feature.id == null) continue
    if (feature.properties?.extrude !== 'true' || feature.properties?.underground !== 'false') continue
    if (!pieces.has(feature.id)) pieces.set(feature.id, [])
    pieces.get(feature.id).push(feature)
  }
  const out = []
  for (const buildingPieces of pieces.values()) {
    const points = buildingPieces.flatMap((f) => outerRings(f.geometry).flat())
    if (points.length === 0) continue
    const lng = points.reduce((sum, p) => sum + p[0], 0) / points.length
    const lat = points.reduce((sum, p) => sum + p[1], 0) / points.length
    if (!rings.some((ring) => ringContains(ring, lng, lat))) continue
    if (skipPins.some(([pinLng, pinLat]) => buildingPieces.some((f) => featureContains(f.geometry, pinLng, pinLat)))) continue
    for (const f of buildingPieces) {
      const { est_height: estHeight, height, min_height: minHeight } = f.properties
      out.push({
        type: 'Feature',
        properties: { height: Number(height ?? estHeight) || 0, base: minHeight > 0 ? minHeight : 0 },
        geometry: f.geometry,
      })
    }
  }
  return out
}

function buildCampusMaskFeature(campuses) {
  const holes = []
  for (const campus of campuses) {
    try {
      const ring = closeRing(JSON.parse(campus.boundaryJson))
      if (ring.length >= 4) holes.push(ring)
    } catch {}
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...holes] },
  }
}

const PIN_PATH = 'M16 41C16 41 2 26.5 2 16a14 14 0 1 1 28 0c0 10.5-14 25-14 25Z'
const TAG_PATH = 'M8.5 2h11A6.5 6.5 0 0 1 26 8.5v11a6.5 6.5 0 0 1-6.5 6.5h-2L14 35l-3.5-9h-2A6.5 6.5 0 0 1 2 19.5v-11A6.5 6.5 0 0 1 8.5 2Z'

function hasMarker(facility) {
  return isInteractiveFacility(facility)
}

function selectKey(facility) {
  return `${facility.type}:${facility.id}`
}

function isInteractiveFacility(facility) {
  return CAMPUS_AREA_TYPES.includes(facility.type)
}

function sizeIcon(container, px) {
  const svg = container.querySelector('.map-pin-icon svg')
  if (svg) {
    svg.style.width = `${px}px`
    svg.style.height = `${px}px`
  }
}

function countEmbedded(allFacilities) {
  const counts = new Map()
  for (const f of allFacilities) {
    if (f.type !== 'Storage' && f.type !== 'Venue') continue
    const entry = counts.get(f.facilityId) ?? { storage: 0, venue: 0 }
    if (f.type === 'Storage') entry.storage++
    else entry.venue++
    counts.set(f.facilityId, entry)
  }
  return counts
}

function buildCountBadge({ storage, venue }) {
  if (!storage && !venue) return null
  const segment = (type, count) => {
    const { color, icon: faIcon } = FACILITY_TYPE_STYLES[type]
    return `<span class="flex items-center gap-0.5" style="color:${color}"><span class="map-pin-badge-icon flex">${icon(faIcon).html[0]}</span><span>${count}</span></span>`
  }
  const badge = document.createElement('div')
  badge.className = 'pointer-events-none absolute bottom-full left-1/2 mb-0.5 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold leading-none shadow-md'
  badge.innerHTML = [storage && segment('Storage', storage), venue && segment('Venue', venue)].filter(Boolean).join('')
  badge.querySelectorAll('.map-pin-badge-icon svg').forEach((svg) => {
    svg.style.width = '9px'
    svg.style.height = '9px'
  })
  return badge
}

function buildPinElement(style, counts) {
  const el = document.createElement('div')
  el.className = 'map-pin relative h-[42px] w-8 cursor-pointer'
  const pin = document.createElement('div')
  pin.className = 'map-pin-body relative h-full w-full'
  pin.innerHTML = `
    <svg viewBox="0 0 32 42" width="32" height="42" style="display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.35))">
      <path class="map-pin-shape" d="${PIN_PATH}" fill="${style.color}" stroke="#fff" stroke-width="1.5" />
      <circle cx="16" cy="16" r="9.5" fill="#fff" />
    </svg>
    <span class="map-pin-icon absolute left-4 top-4 flex -translate-x-1/2 -translate-y-1/2" style="color:${style.color}">${icon(style.icon).html[0]}</span>
  `
  sizeIcon(pin, 11)
  const badge = buildCountBadge(counts)
  if (badge) pin.appendChild(badge)
  el.appendChild(pin)
  return el
}

function buildTagElement(style) {
  const el = document.createElement('div')
  el.className = 'map-pin map-pin--tag relative h-9 w-7 cursor-pointer'
  const tag = document.createElement('div')
  tag.className = 'map-pin-body relative h-full w-full'
  tag.innerHTML = `
    <svg viewBox="0 0 28 36" width="28" height="36" style="display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.35))">
      <path class="map-pin-shape" d="${TAG_PATH}" fill="${style.color}" stroke="#fff" stroke-width="1.5" />
    </svg>
    <span class="map-pin-icon absolute left-[14px] top-[14px] flex -translate-x-1/2 -translate-y-1/2 text-white">${icon(style.icon).html[0]}</span>
  `
  sizeIcon(tag, 12)
  el.appendChild(tag)
  return el
}

function buildMarkerElement(facility, counts, onSelect) {
  const style = FACILITY_TYPE_STYLES[facility.type] ?? FACILITY_TYPE_STYLES.Venue
  const el = buildPinElement(style, counts)
  el.dataset.selectKey = selectKey(facility)
  const label = document.createElement('span')
  label.textContent = facility.name
  label.className = 'facility-label pointer-events-none absolute left-1/2 top-full mt-0.5 w-max max-w-[9rem] -translate-x-1/2 text-center text-[11px] font-semibold leading-tight'
  el.appendChild(label)
  el.addEventListener('click', (event) => {
    event.stopPropagation()
    onSelect(facility)
  })
  return el
}

function isDaytime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

const LABEL_MIN_ZOOM = 17.8

const TREE_MIN_ZOOM = 16.5

function applyLightPreset(map, mode = 'auto') {
  const day = mode === 'auto' ? isDaytime() : mode === 'light'
  map.getContainer().dataset.night = String(!day)
  try {
    map.setConfigProperty('basemap', 'lightPreset', day ? 'day' : 'night')
  } catch {}
}

function applyLabelConfig(map) {
  try {
    map.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
    map.setConfigProperty('basemap', 'show3dBuildings', false)
  } catch {}
}

function detectPlaceNameAt(map, point) {
  const features = map.queryRenderedFeatures(point)
  for (const feature of features) {
    const name = feature.properties?.name
    if (typeof name === 'string' && name.trim()) return name.trim()
  }
  return null
}

function MapCanvas({
  campuses,
  facilities,
  allFacilities,
  placementMode,
  placementFacilityId,
  onPlacementClick,
  onCancelPlacement,
  onMoveItem,
  onEditArea,
  onDeleteArea,
  onEditItem,
  onDeleteItem,
  onAddEmbeddedItem,
  onSelectionActiveChange,
  closeSignal,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const treeCheckedRef = useRef(new Set())
  const treeRejectedRef = useRef(new Set())
  const [mapLoaded, setMapLoaded] = useState(false)
  const introPlayedRef = useRef(false)

  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem(MAP_THEME_STORAGE_KEY)
      return MAP_THEME_MODES.includes(saved) ? saved : 'auto'
    } catch {
      return 'auto'
    }
  })
  const themeModeRef = useRef(themeMode)
  themeModeRef.current = themeMode
  useEffect(() => {
    try {
      localStorage.setItem(MAP_THEME_STORAGE_KEY, themeMode)
    } catch {}
    const map = mapRef.current
    if (map && mapLoaded) applyLightPreset(map, themeMode)
  }, [themeMode, mapLoaded])

  const placementModeRef = useRef(placementMode)
  placementModeRef.current = placementMode
  const onPlacementClickRef = useRef(onPlacementClick)
  onPlacementClickRef.current = onPlacementClick
  const placementFacility =
    placementFacilityId != null
      ? allFacilities.find((f) => f.id === placementFacilityId && isInteractiveFacility(f)) ?? null
      : null
  const placementFacilityRef = useRef(placementFacility)
  placementFacilityRef.current = placementFacility
  const [placementError, setPlacementError] = useState(null)
  const setPlacementErrorRef = useRef(setPlacementError)

  const [selected, setSelected] = useState(null)
  const [minimized, setMinimized] = useState(false)
  const [subItem, setSubItem] = useState(null)
  const selectedAreaKey = selected ? selectKey(selected.data) : null
  useEffect(() => {
    setSubItem(null)
  }, [selectedAreaKey])

  const gridAngles = useMemo(() => {
    const angles = new Map()
    for (const campus of campuses) {
      let ring = null
      try {
        ring = closeRing(JSON.parse(campus.boundaryJson))
      } catch {}
      angles.set(campus.id, campusGridAngle(ring))
    }
    return angles
  }, [campuses])
  const gridAngleFor = (facility) => {
    const branchId = isInteractiveFacility(facility)
      ? facility.branchId
      : allFacilities.find((f) => f.id === facility.facilityId && isInteractiveFacility(f))?.branchId
    return gridAngles.get(branchId) ?? gridAngles.values().next().value ?? 0
  }
  const gridAngleForRef = useRef(gridAngleFor)
  gridAngleForRef.current = gridAngleFor

  const [moving, setMoving] = useState(null)
  const movingRef = useRef(moving)
  movingRef.current = moving
  const movingParent = moving && !isInteractiveFacility(moving.item)
    ? allFacilities.find((f) => f.id === moving.item.facilityId && isInteractiveFacility(f)) ?? null
    : null
  let moveError = null
  if (moving) {
    const [lng, lat] = moving.lngLat
    if (isInteractiveFacility(moving.item)) {
      const branch = campuses.find((c) => c.id === moving.item.branchId)
      const rings = campusRings(branch ? [branch] : campuses)
      if (!rings.some((ring) => ringContains(ring, lng, lat))) moveError = 'Keep the pin inside the campus boundary.'
    } else if (movingParent && !isWithinFacilityGeofence(movingParent, lng, lat, gridAngleFor(movingParent))) {
      moveError = `Keep the pin inside the highlighted area of ${movingParent.name} (up to ${FACILITY_GEOFENCE_MARGIN_M} m around it).`
    }
  }
  const startMove = (item) => {
    if (placementModeRef.current) return
    setMoving({ item, lngLat: [item.longitude, item.latitude], serverError: null, saving: false })
    setMinimized(true)
  }
  const saveMove = async () => {
    if (!moving || moveError) return
    setMoving((m) => ({ ...m, saving: true, serverError: null }))
    const result = await onMoveItem(moving.item, moving.lngLat)
    if (result?.ok) {
      setMoving(null)
      setMinimized(false)
    } else {
      setMoving((m) => m && { ...m, saving: false, serverError: result?.message || 'Could not save the new position.' })
    }
  }
  const cancelMove = () => {
    setMoving(null)
    setMinimized(false)
  }
  useEffect(() => {
    if (!subItem) return
    const fresh = allFacilities.find((f) => f.id === subItem.id && f.type === subItem.type)
    if (fresh !== subItem) setSubItem(fresh ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFacilities])

  useEffect(() => {
    onSelectionActiveChange?.(!!selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      maxPitch: 60,
      attributionControl: false,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left')

    const updateLabelVisibility = () => {
      map.getContainer().dataset.showLabels = String(map.getZoom() >= LABEL_MIN_ZOOM)
    }
    map.on('zoom', updateLabelVisibility)
    map.on('load', () => {
      updateLabelVisibility()
      applyLightPreset(map, themeModeRef.current)
      applyLabelConfig(map)
      setMapLoaded(true)
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    const lightIntervalId = window.setInterval(() => applyLightPreset(map, themeModeRef.current), 10 * 60 * 1000)

    const handlePlacementClick = (e) => {
      if (movingRef.current) {
        setMoving((m) => m && { ...m, lngLat: [e.lngLat.lng, e.lngLat.lat], serverError: null })
        return
      }
      if (!placementModeRef.current) return
      const facility = placementFacilityRef.current
      const { lng, lat } = facility ? placementPointOnFacility(map, e, facility) : e.lngLat
      if (facility && !isWithinFacilityGeofence(facility, lng, lat, gridAngleForRef.current(facility))) {
        setPlacementErrorRef.current(
          `That spot is outside ${facility.name}. Click inside the highlighted area (up to ${FACILITY_GEOFENCE_MARGIN_M} m around it).`,
        )
        return
      }
      setPlacementErrorRef.current(null)
      const detectedName = detectPlaceNameAt(map, e.point)
      const detectedShape = detectBuildingShapeAt(map, e.point, lng, lat)
      onPlacementClickRef.current?.([lng, lat], detectedName, detectedShape)
    }
    map.on('click', handlePlacementClick)

    return () => {
      window.clearInterval(lightIntervalId)
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    let cancelled = false
    let onIdle = null
    const treeKey = (t) => `${t.lng.toFixed(7)},${t.lat.toFixed(7)}`
    const sourceId = 'campus-trees'

    fetch(`${import.meta.env.BASE_URL}trees.geojson`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((featureCollection) => {
        if (cancelled || !featureCollection) return
        const candidates = generateTrees(featureCollection)

        const render = () => {
          const live = candidates.filter((t) => !treeRejectedRef.current.has(treeKey(t)))
          const data = treesToGeoJSON(live)
          if (map.getSource(sourceId)) {
            map.getSource(sourceId).setData(data)
            return
          }
          map.addSource(sourceId, { type: 'geojson', data })
          const firstSymbolLayer = map.getStyle().layers.find((l) => l.type === 'symbol')
          map.addLayer(
            {
              id: `${sourceId}-extrusion`,
              type: 'fill-extrusion',
              source: sourceId,
              minzoom: TREE_MIN_ZOOM,
              paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-opacity': 1,
                'fill-extrusion-cast-shadows': false,
              },
            },
            firstSymbolLayer?.id,
          )
        }
        render()

        onIdle = () => {
          if (map.isMoving() || map.getZoom() < TREE_MIN_ZOOM) return
          const canvas = map.getCanvas()
          let rejectedAny = false
          for (const tree of candidates) {
            if (tree.fixed) continue
            const key = treeKey(tree)
            if (treeCheckedRef.current.has(key)) continue
            const { x, y } = map.project([tree.lng, tree.lat])
            if (x < 0 || y < 0 || x > canvas.clientWidth || y > canvas.clientHeight) continue
            treeCheckedRef.current.add(key)
            const hits = map.queryRenderedFeatures([[x - 4, y - 4], [x + 4, y + 4]])
            const inBuilding = hits.some(
              (f) => typeof (f.properties?.height ?? f.properties?.render_height) === 'number' && featureContains(f.geometry, tree.lng, tree.lat),
            )
            if (inBuilding) {
              treeRejectedRef.current.add(key)
              rejectedAny = true
            }
          }
          if (rejectedAny) render()
        }
        map.on('idle', onIdle)
      })

    return () => {
      cancelled = true
      if (onIdle) map.off('idle', onIdle)
    }
  }, [mapLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    const rings = campusRings(campuses)
    const skipPins = facilities.filter((f) => f.heightOverride).map((f) => [f.longitude, f.latitude])
    const sourceId = 'campus-buildings'

    const emptyData = { type: 'FeatureCollection', features: [] }
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data: emptyData })
      map.addLayer({
        id: CAMPUS_BUILDINGS_LAYER_ID,
        type: 'fill-extrusion',
        source: sourceId,
        slot: 'middle',
        layout: { 'fill-extrusion-edge-radius': 0.4 },
        paint: CAMPUS_BUILDING_PAINT,
      })
    }

    let lastSignature = null
    let frame = null
    const rebuild = () => {
      frame = null
      const features = rings.length ? campusBuildingFeatures(loadedBasemapBuildings(map), rings, skipPins) : []
      const signature = features.map((f) => `${f.properties.height}:${f.geometry.coordinates[0]?.[0]}`).join('|')
      if (signature === lastSignature) return
      lastSignature = signature
      map.getSource(sourceId)?.setData({ type: 'FeatureCollection', features })
    }
    const scheduleRebuild = () => {
      if (frame == null) frame = window.requestAnimationFrame(rebuild)
    }
    const onSourceData = (e) => {
      if (e.sourceId === BASEMAP_BUILDING_SOURCE && e.tile) scheduleRebuild()
    }
    rebuild()
    map.on('sourcedata', onSourceData)
    map.on('idle', scheduleRebuild)
    return () => {
      if (frame != null) window.cancelAnimationFrame(frame)
      map.off('sourcedata', onSourceData)
      map.off('idle', scheduleRebuild)
    }
  }, [mapLoaded, campuses, facilities])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    map.getCanvas().style.cursor = placementMode ? 'crosshair' : ''
  }, [mapLoaded, placementMode])

  const geofenceFacility = placementFacility ?? movingParent ?? selected?.data ?? null
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    if (!placementFacility) setPlacementError(null)

    const sourceId = 'placement-geofence'
    let feature = null
    if (geofenceFacility) {
      const ring = facilityGeofenceRing(geofenceFacility, gridAngleFor(geofenceFacility))
      if (ring) {
        feature = {
          type: 'Feature',
          properties: { fill: '#fccb35', edge: '#e0a800' },
          geometry: { type: 'Polygon', coordinates: [ring] },
        }
      }
    }
    const data = { type: 'FeatureCollection', features: feature ? [feature] : [] }
    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(data)
    } else {
      map.addSource(sourceId, { type: 'geojson', data })
      map.addLayer(
        {
          id: GEOFENCE_FILL_LAYER_ID,
          type: 'fill',
          source: sourceId,
          slot: 'middle',
          paint: { 'fill-color': ['get', 'fill'], 'fill-opacity': 0.35 },
        },
        groundLayerBefore(map),
      )
      map.addLayer(
        {
          id: GEOFENCE_EDGE_LAYER_ID,
          type: 'line',
          source: sourceId,
          slot: 'middle',
          paint: { 'line-color': ['get', 'edge'], 'line-width': 2.5 },
        },
        groundLayerBefore(map),
      )
    }
    map.setPaintProperty(GEOFENCE_FILL_LAYER_ID, 'fill-color', ['get', 'fill'])
    map.setPaintProperty(GEOFENCE_EDGE_LAYER_ID, 'line-color', ['get', 'edge'])
  }, [mapLoaded, placementFacility, geofenceFacility])

  const moveMarkerRef = useRef(null)
  const movingKey = moving ? selectKey(moving.item) : null
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !movingRef.current) return
    const { item, lngLat } = movingRef.current
    const style = FACILITY_TYPE_STYLES[item.type] ?? FACILITY_TYPE_STYLES.Venue
    const el = isInteractiveFacility(item) ? buildPinElement(style, { storage: 0, venue: 0 }) : buildTagElement(style)
    el.dataset.active = 'true'
    el.classList.replace('cursor-pointer', 'cursor-grab')
    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom', draggable: true }).setLngLat(lngLat).addTo(map)
    const onDrag = () => {
      const { lng, lat } = marker.getLngLat()
      setMoving((m) => m && { ...m, lngLat: [lng, lat], serverError: null })
    }
    marker.on('drag', onDrag)
    moveMarkerRef.current = marker
    return () => {
      marker.remove()
      moveMarkerRef.current = null
    }
  }, [mapLoaded, movingKey])
  useEffect(() => {
    if (moving && moveMarkerRef.current) moveMarkerRef.current.setLngLat(moving.lngLat)
  }, [moving])

  const subItemKey = subItem ? selectKey(subItem) : null
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded || !subItem) return
    const zoomPullback = Math.min(1, markerAltitude(subItem) / 60)
    map.easeTo({
      center: [subItem.longitude, subItem.latitude],
      zoom: Math.max(map.getMinZoom(), Math.max(map.getZoom(), 19.5) - zoomPullback),
      pitch: 60,
      duration: 1400,
      essential: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, subItemKey])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    let introTimeoutId = null
    let startIntroTilt = null

    function flyToAndSelect(data, lngLat, altitude = 0) {
      if (placementModeRef.current || movingRef.current) return
      setSelected({ data, lngLat })
      const zoomPullback = Math.min(1, altitude / 60)
      const targetZoom = Math.max(map.getMinZoom(), Math.max(map.getZoom(), 19) - zoomPullback)
      const duration = 1500 + zoomPullback * 500
      map.easeTo({
        center: lngLat,
        zoom: targetZoom,
        pitch: 60,
        duration,
        essential: true,
      })
    }

    campuses.forEach((campus) => {
      const sourceId = `campus-boundary-${campus.id}`
      let coords
      try {
        coords = closeRing(JSON.parse(campus.boundaryJson))
      } catch {
        return
      }
      if (coords.length < 4) return

      const geojson = {
        type: 'Feature',
        properties: { name: campus.name },
        geometry: { type: 'Polygon', coordinates: [coords] },
      }

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson)
        return
      }

      map.addSource(sourceId, { type: 'geojson', data: geojson })
      map.addLayer({
        id: `${sourceId}-fill`,
        type: 'fill',
        source: sourceId,
        slot: 'middle',
        paint: { 'fill-color': '#fccb35', 'fill-opacity': 0.15 },
      }, campusGroundLayerBefore(map))
      map.addLayer({
        id: `${sourceId}-line`,
        type: 'line',
        source: sourceId,
        slot: 'middle',
        paint: { 'line-color': '#fccb35', 'line-width': 2 },
      }, campusGroundLayerBefore(map))
    })

    const maskSourceId = 'campus-mask'
    const maskGeojson = buildCampusMaskFeature(campuses)
    if (map.getSource(maskSourceId)) {
      map.getSource(maskSourceId).setData(maskGeojson)
    } else {
      map.addSource(maskSourceId, { type: 'geojson', data: maskGeojson })
      map.addLayer({
        id: `${maskSourceId}-fill`,
        type: 'fill',
        source: maskSourceId,
        slot: 'middle',
        paint: { 'fill-color': OUTSIDE_CAMPUS_COLOR, 'fill-opacity': 0.55 },
      }, campusGroundLayerBefore(map))
    }

    if (campuses.length > 0 && !introPlayedRef.current) {
      const allRealCoords = []
      const allTightCoords = []
      for (const campus of campuses) {
        try {
          const c = closeRing(JSON.parse(campus.boundaryJson))
          if (c.length >= 4) {
            allRealCoords.push(...c)
            allTightCoords.push(...insetRing(c, 0.5))
          }
        } catch {}
      }

      if (allRealCoords.length > 0) {
        const tightBounds = allTightCoords.reduce(
          (b, [lng, lat]) => b.extend([lng, lat]),
          new mapboxgl.LngLatBounds(allTightCoords[0], allTightCoords[0]),
        )

        map.fitBounds(tightBounds, { pitch: 0, bearing: 0, padding: 0, duration: 0 })

        const realBounds = allRealCoords.reduce(
          (b, [lng, lat]) => b.extend([lng, lat]),
          new mapboxgl.LngLatBounds(allRealCoords[0], allRealCoords[0]),
        )
        const padLng = (realBounds.getEast() - realBounds.getWest()) * 0.15
        const padLat = (realBounds.getNorth() - realBounds.getSouth()) * 0.15
        map.setMaxBounds([
          [realBounds.getWest() - padLng, realBounds.getSouth() - padLat],
          [realBounds.getEast() + padLng, realBounds.getNorth() + padLat],
        ])

        const introCenter = map.getCenter()
        const introZoom = map.getZoom()

        map.setMinZoom(introZoom)

        startIntroTilt = () => {
          introTimeoutId = window.setTimeout(() => {
            introPlayedRef.current = true
            map.easeTo({ center: introCenter, zoom: introZoom, pitch: 45, bearing: 0, duration: 2200 })
          }, 900)
        }
        map.once('idle', startIntroTilt)
      }
    }

    const buildingsSourceId = 'facility-buildings'
    const buildingsGeojson = {
      type: 'FeatureCollection',
      features: facilities.map(facilityFootprintFeature).filter(Boolean),
    }
    if (map.getSource(buildingsSourceId)) {
      map.getSource(buildingsSourceId).setData(buildingsGeojson)
      Object.entries(CAMPUS_BUILDING_PAINT).forEach(([prop, value]) => map.setPaintProperty(OVERRIDE_LAYER_ID, prop, value))
    } else {
      map.addSource(buildingsSourceId, { type: 'geojson', data: buildingsGeojson })
      map.addLayer({
        id: OVERRIDE_LAYER_ID,
        type: 'fill-extrusion',
        source: buildingsSourceId,
        slot: 'middle',
        layout: { 'fill-extrusion-edge-radius': 0.4 },
        paint: CAMPUS_BUILDING_PAINT,
      })
    }

    const embeddedCounts = countEmbedded(allFacilities)
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = facilities.filter(hasMarker).map((facility) =>
      new mapboxgl.Marker({
        element: buildMarkerElement(facility, embeddedCounts.get(facility.id) ?? { storage: 0, venue: 0 }, (f) =>
          flyToAndSelect(f, [f.longitude, f.latitude], markerAltitude(f)),
        ),
        altitude: markerAltitude(facility),
        anchor: 'bottom',
      })
        .setLngLat([facility.longitude, facility.latitude])
        .addTo(map),
    )

    let declutterFrame = null
    const declutterLabels = () => {
      declutterFrame = null
      const entries = markersRef.current
        .map((marker) => ({ el: marker.getElement(), label: marker.getElement().querySelector('.facility-label') }))
        .filter((entry) => entry.label)
      entries.forEach((entry) => {
        entry.label.style.visibility = ''
        entry.rect = entry.label.getBoundingClientRect()
        entry.pinBottom = entry.el.getBoundingClientRect().bottom
      })
      entries.sort((a, b) => b.pinBottom - a.pinBottom)
      const kept = []
      for (const { label, rect } of entries) {
        if (rect.width === 0) continue
        const overlaps = kept.some((k) => rect.left < k.right && rect.right > k.left && rect.top < k.bottom && rect.bottom > k.top)
        if (overlaps) label.style.visibility = 'hidden'
        else kept.push(rect)
      }
    }
    const scheduleDeclutter = () => {
      if (declutterFrame == null) declutterFrame = window.requestAnimationFrame(declutterLabels)
    }
    map.on('render', scheduleDeclutter)
    scheduleDeclutter()

    return () => {
      if (startIntroTilt) map.off('idle', startIntroTilt)
      if (introTimeoutId) window.clearTimeout(introTimeoutId)
      map.off('render', scheduleDeclutter)
      if (declutterFrame != null) window.cancelAnimationFrame(declutterFrame)
    }
  }, [mapLoaded, campuses, facilities, allFacilities])

  useEffect(() => {
    const activeKey = selected ? selectKey(selected.data) : null
    markersRef.current.forEach((marker) => {
      const el = marker.getElement()
      el.dataset.active = String(el.dataset.selectKey === activeKey)
      el.style.display = el.dataset.selectKey === movingKey ? 'none' : ''
    })
  }, [selected, movingKey, mapLoaded, campuses, facilities, allFacilities])

  const handleCloseSelection = () => {
    setSelected(null)
    setMinimized(false)
  }

  useEffect(() => {
    if (closeSignal) handleCloseSelection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSignal])

  useEffect(() => {
    if (!selected) return
    const fresh = allFacilities.find((f) => f.id === selected.data.id && f.type === selected.data.type)
    if (!fresh) {
      handleCloseSelection()
    } else if (fresh !== selected.data) {
      setSelected((prev) => (prev ? { ...prev, data: fresh } : prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFacilities])

  const handleDeleteAreaWrapped = async (id) => {
    const result = await onDeleteArea(id)
    if (result?.ok) handleCloseSelection()
    return result
  }

  return (
    <div className="relative h-[calc(100vh-48px)] w-full overflow-hidden lg:h-[calc(100vh-57px)]">
      <div
        ref={containerRef}
        className={`h-full w-full transition-opacity duration-700 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className={`absolute inset-0 z-30 transition-opacity duration-500 ${
          mapLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <MapLoadingOverlay label="Loading campus map…" />
      </div>
      <MapLegend />
      {mapLoaded && <MapThemeToggle mode={themeMode} onChange={setThemeMode} />}
      {placementMode && placementFacility && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 w-[min(26rem,calc(100%-2rem))] -translate-x-1/2 sm:left-[calc(50%-10rem)]">
          <div className="pointer-events-auto rounded-xl bg-white px-4 py-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-700">
                Click inside the highlighted area of <span className="font-semibold text-gray-900">{placementFacility.name}</span> to
                place the new {placementMode === 'venue' ? 'venue' : 'storage area'}.
              </p>
              <button
                type="button"
                onClick={onCancelPlacement}
                className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
            {placementError && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{placementError}</p>
            )}
          </div>
        </div>
      )}
      {moving && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-30 w-[min(26rem,calc(100%-2rem))] -translate-x-1/2">
          <div className="pointer-events-auto rounded-xl bg-white px-4 py-3 shadow-lg">
            <p className="text-sm text-gray-700">
              Drag the pin, or click the map, to move{' '}
              <span className="font-semibold text-gray-900">{moving.item.name}</span>.
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {moving.lngLat[1].toFixed(6)}, {moving.lngLat[0].toFixed(6)}
            </p>
            {(moveError || moving.serverError) && (
              <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {moveError || moving.serverError}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={cancelMove}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMove}
                disabled={!!moveError || moving.saving}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-lg bg-[#fccb35] px-3 py-2 text-xs font-bold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {moving.saving ? 'Saving…' : 'Save position'}
              </button>
            </div>
          </div>
        </div>
      )}
      {selected && (
        <DetailsSidebar
          key={`${selected.data.type}-${selected.data.id}`}
          title="Location Details"
          minimized={minimized}
          onToggleMinimize={() => setMinimized((v) => !v)}
          onClose={handleCloseSelection}
        >
          <AreaDetailsContent
            area={selected.data}
            allFacilities={allFacilities}
            subItem={subItem}
            onSubItemChange={setSubItem}
            onEditArea={onEditArea}
            onDeleteArea={handleDeleteAreaWrapped}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onAddItem={(kind) => onAddEmbeddedItem(kind, selected.data.id)}
            onMovePin={startMove}
          />
        </DetailsSidebar>
      )}
    </div>
  )
}

export default MapCanvas
