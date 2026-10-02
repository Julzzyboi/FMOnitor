import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { icon } from '@fortawesome/fontawesome-svg-core'
import { FACILITY_TYPE_STYLES, CAMPUS_AREA_TYPES } from '../facilityTypes'
import DetailsSidebar from '../panels/DetailsSidebar'
import AreaDetailsContent from '../panels/AreaDetailsContent'
import MapLoadingOverlay from './MapLoadingOverlay'
import MapLegend from './MapLegend'
import MapThemeToggle, { MAP_THEME_MODES, MAP_THEME_STORAGE_KEY } from './MapThemeToggle'
import { generateTrees, treesToGeoJSON, ringContains } from './trees'
import {
  FACILITY_GEOFENCE_MARGIN_M,
  campusGridAngle,
  facilityGeofenceRing,
  facilityOutline,
  isWithinFacilityGeofence,
} from './geofence'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// Rough UST España fallback - only ever shown for the single frame before the
// first campus loads and fitBounds() reframes to the real boundary below.
const DEFAULT_CENTER = [120.9894, 14.6091]
const DEFAULT_ZOOM = 20

// Mapbox's own Standard style (v3) - real 3D buildings, terrain-aware colors,
// and built-in POI/place icons and labels, all native to the style itself
// rather than hand-painted layer-by-layer the way the old light-v11 setup
// needed (see applyStandardStyleConfig below). VITE_MAPBOX_STYLE can still
// override this with a custom Studio style URL if one's ever made.
const MAP_STYLE = import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/standard'

// Paint for all our 3D buildings - the campus's own (campusBuildingFeatures)
// and hand-corrected ones (facilityFootprintFeature). Copies Standard style's
// `3d-building` layer: same color expression, read from the basemap's own
// `colorBuildings` config, plus its rounded edges, ground shading and night
// flood light - so they look exactly like Mapbox's buildings in every light
// preset, with nothing to keep in sync by hand.
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
}

// Shrinks a ring's points toward its own centroid by `factor` (0 = no
// change, 0.3 = 30% closer to center). Used only to compute a *tighter*
// virtual boundary to hand to fitBounds for framing - the actual rendered
// boundary layer still uses the real, unshrunk coordinates. fitBounds' own
// "exact fit" (padding: 0) still leaves the shape sitting fully inside the
// viewport with room to spare; telling it to fit a smaller shape is what
// pushes the real, larger boundary out toward/past the frame edges.
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

// Our own 3D block for a facility whose height was corrected by hand
// (heightOverride) because Mapbox's building is wrong - e.g. Henry Sy Sr.
// Hall, which Mapbox draws at 3 m. Every other facility's footprint/height
// already matches the building Mapbox draws, so it gets no block of its own.
// Only fixes buildings Mapbox draws too SHORT: a taller Mapbox building still
// shows above a lower block.
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

// The Mapbox building standing on a clicked point: its outline and height,
// saved with a new facility so the pin sits on that roof. A building only
// counts if its outline CONTAINS the point - at a pitched camera the pixels
// around a ground point often belong to a taller neighbor's wall. Returns
// null on open ground; the backend then stores a small square and height 0.
// The outline can be cut at a map tile edge for a very large building.
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

// Every facility/storage/venue row carries its own height (0 for anything
// that isn't a building) - the pin sits at that height, on the roof. A
// storage/venue carries its parent's outline and height, but one placed in
// the ground band around the building (outside its walls) stands on the
// ground instead of floating at roof height beside it.
function markerAltitude(facility) {
  if (facility.type === 'Storage' || facility.type === 'Venue') {
    const ring = facilityOutline(facility)
    if (ring && !ringContains(ring, facility.longitude, facility.latitude)) return 0
  }
  return facility.height ?? 0
}

// Where a placement click lands on `facility`: on its roof when the click
// hit its 3D building, otherwise on the ground.
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

// boundaryJson is stored as [[lng,lat], ...] without necessarily repeating the
// first point at the end - a valid GeoJSON polygon ring must close on itself.
function closeRing(coords) {
  if (coords.length === 0) return coords
  const [firstLng, firstLat] = coords[0]
  const [lastLng, lastLat] = coords[coords.length - 1]
  return firstLng === lastLng && firstLat === lastLat ? coords : [...coords, coords[0]]
}

// A GeoJSON polygon's rings after the first are holes cut out of it - this
// builds one giant rectangle covering way more area than anyone could ever
// pan to, with every campus's own boundary punched out of it as a hole, so a
// single fill layer dims the surrounding city (roads, stock buildings,
// labels) while leaving each campus's own interior completely untouched.
// Precise per-building matching (which OSM building is "inside" vs
// "outside") was tried earlier in this project for 3D extrusions and dropped
// for being unreliable in dense clusters - this sidesteps that entirely by
// only ever testing against the campus's own real, admin-drawn boundary.
const WORLD_RING = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
]

// The ground outside the campus is dimmed toward this (campus-mask fill).
const OUTSIDE_CAMPUS_COLOR = '#4b4b4b'
const BASEMAP_BUILDINGS = { featuresetId: 'buildings', importId: 'basemap' }
// Where Standard's buildings come from, inside its 'basemap' import.
const BASEMAP_BUILDING_SOURCE = 'composite'

// Every building in the tiles loaded so far. This reads Mapbox's internal
// per-import style (the public querySourceFeatures can't see sources inside
// an import), so it falls back to the public query of what's on screen right
// now if a future mapbox-gl version changes that.
function loadedBasemapBuildings(map) {
  try {
    return map.style.getFragmentStyle('basemap').querySourceFeatures(BASEMAP_BUILDING_SOURCE, { sourceLayer: 'building' })
  } catch {
    try {
      return map.queryRenderedFeatures({ target: BASEMAP_BUILDINGS })
    } catch {
      return [] // Not a Standard-style map - no buildings to style.
    }
  }
}

// Rings of every campus boundary, closed - used to decide which of the
// city's buildings stand outside every campus.
function campusRings(campuses) {
  const rings = []
  for (const campus of campuses) {
    try {
      const ring = closeRing(JSON.parse(campus.boundaryJson))
      if (ring.length >= 4) rings.push(ring)
    } catch {
      // Malformed boundary - that campus just doesn't count as "inside".
    }
  }
  return rings
}

// Ground layers (campus fill/outline, outside mask) share slot 'middle' with
// our 3D buildings and must sit under them - a flat fill added after the
// buildings is painted over them, tinting the campus yellow.
function groundLayerBefore(map) {
  return map.getLayer(CAMPUS_BUILDINGS_LAYER_ID) ? CAMPUS_BUILDINGS_LAYER_ID : undefined
}

// The campus fill/outline and outside mask also go under the selected
// location's geofence highlight, so the mask never darkens the part of the
// geofence band that crosses the campus boundary.
function campusGroundLayerBefore(map) {
  return map.getLayer(GEOFENCE_FILL_LAYER_ID) ? GEOFENCE_FILL_LAYER_ID : groundLayerBefore(map)
}

function outerRings(geometry) {
  if (geometry?.type === 'Polygon') return [geometry.coordinates[0]]
  if (geometry?.type === 'MultiPolygon') return geometry.coordinates.map((polygon) => polygon[0])
  return []
}

// Mapbox's own buildings that stand inside a campus, as features for our
// campus 3D layer - Mapbox's 3D buildings are switched off everywhere (see
// applyBasemapConfig), so outside the campus stays flat.
//
// The same building comes back once per loaded tile, and from every zoom
// level loaded; only the most detailed zoom is kept, where a building that
// crosses a tile edge arrives as matching pieces of one outline. A building
// counts as inside when the center of all its pieces is inside a campus, so
// one straddling the boundary goes whichever way most of it lies. Height is
// the tile's `height` - the same value saved for each facility, so pins and
// roof clicks (both at the saved height) line up with the roofs drawn here.
// Standard's own layer prefers `est_height`, which can differ.
// `skipPins` are points of hand-corrected facilities - the building under
// each is left out, since the override layer draws it at its fixed height.
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
    } catch {
      // Malformed boundary JSON for this one campus - just don't cut a hole
      // for it, doesn't block the mask from covering everything else.
    }
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [WORLD_RING, ...holes] },
  }
}

// Location pin: teardrop outline in a 32x42 box, round head centered at
// (16,16), tip at the bottom-center (16,41) - the tip is the spot it marks.
const PIN_PATH = 'M16 41C16 41 2 26.5 2 16a14 14 0 1 1 28 0c0 10.5-14 25-14 25Z'
// Storage/venue tag: a rounded square with a short pointer, in a 28x36 box, tip at
// the bottom-center (14,35) - a different shape from the location pins, so
// what's a place and what's a room inside it reads at a glance.
const TAG_PATH = 'M8.5 2h11A6.5 6.5 0 0 1 26 8.5v11a6.5 6.5 0 0 1-6.5 6.5h-2L14 35l-3.5-9h-2A6.5 6.5 0 0 1 2 19.5v-11A6.5 6.5 0 0 1 8.5 2Z'

// Only locations get a marker. Storage/venues have none of their own: their
// counts ride on their location's pin (buildCountBadge) and their details
// live in its panel. They share their location's geofence too.
function hasMarker(facility) {
  return isInteractiveFacility(facility)
}

// ids are only unique within a table, so selection is matched on type + id.
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

// How many storage areas and venues sit inside each location, by location
// id - storage/venues have no markers of their own; their counts ride on
// their location's pin instead (see buildCountBadge).
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

// Small pill floating above a location pin: storage icon + count, venue icon
// + count, in their own colors. Only kinds the location actually has are
// shown; with neither, there's no badge at all.
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

// Colored teardrop, white disc, icon in the type's color, plus the count
// badge above it. Shares the .map-pin classes (hover shake, active yellow -
// see index.css); the inner wrapper takes those effects because Mapbox owns
// the outer element's own `transform` (that's how it positions the marker).
// The badge lives inside that wrapper, so it moves with the pin.
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

// Storage/venue: rounded tag in its type's color (orange / purple) with a
// white icon - smaller than a location pin, since it's a room inside one.
// Storage/venues have no markers on the map; this is only the draggable
// stand-in shown while one's pin is being moved ("Move pin").
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

// A location's pin, with its storage/venue count badge; clicking it selects
// that location.
function buildMarkerElement(facility, counts, onSelect) {
  const style = FACILITY_TYPE_STYLES[facility.type] ?? FACILITY_TYPE_STYLES.Venue
  const el = buildPinElement(style, counts)
  el.dataset.selectKey = selectKey(facility)
  // Our own label, attached to the marker itself (hangs just below it) so
  // the marker and its name can never drift apart. The basemap's own POI
  // labels are turned off (see applyLabelConfig). Visibility (only when
  // zoomed in) and color (dark by day, light by night) come from the
  // .facility-label rules in index.css, driven by data attributes on the map
  // container.
  const label = document.createElement('span')
  label.textContent = facility.name
  label.className = 'facility-label pointer-events-none absolute left-1/2 top-full mt-0.5 w-max max-w-[9rem] -translate-x-1/2 text-center text-[11px] font-semibold leading-tight'
  el.appendChild(label)
  el.addEventListener('click', (event) => {
    // Without this, Mapbox's own click-through-to-map handler fires too and
    // can close whatever this click was meant to open.
    event.stopPropagation()
    onSelect(facility)
  })
  return el
}

// Standard style ships its own real colors, 3D buildings, and POI/place
// icons+labels out of the box - no more hand-repainting water/landcover/
// landuse layer-by-layer the way the old light-v11 setup needed. The one
// thing worth still driving ourselves is the light preset (day/dusk/night),
// via Standard's own config-property API rather than a manually managed
// `sky` layer. `setConfigProperty` only exists on Standard (v3) styles - the
// try/catch means a custom Studio style swapped in via VITE_MAPBOX_STYLE
// just quietly skips this instead of throwing.
function isDaytime() {
  // Manila sits close to the equator, so sunrise/sunset barely shift across
  // the year (~5:30am-6:30am and ~5:45pm-6:15pm) - a fixed 6am-6pm day window
  // is a reasonable approximation without pulling in a full sun-position
  // library just for this.
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18
}

// Labels only appear once zoomed in this far - at the campus overview they
// all crowd on top of each other.
const LABEL_MIN_ZOOM = 17.8

// Trees only draw once zoomed in this far - at the campus overview they'd
// just be a green smear, and thousands of extrusions cost frame time.
const TREE_MIN_ZOOM = 16.5

// `mode` is the viewer's choice from MapThemeToggle: 'auto' follows the
// clock (isDaytime), 'light'/'dark' pin the map to day/night regardless of
// the time - e.g. for anyone who prefers the light map even at night.
function applyLightPreset(map, mode = 'auto') {
  const day = mode === 'auto' ? isDaytime() : mode === 'light'
  map.getContainer().dataset.night = String(!day)
  try {
    map.setConfigProperty('basemap', 'lightPreset', day ? 'day' : 'night')
  } catch {
    // Not a Standard-style map (e.g. a custom Studio style) - no light preset
    // config to set, nothing to do.
  }
}

// Standard's own POI icons+labels are hidden so each campus area's pin
// carries its own label instead (see buildMarkerElement) - otherwise every
// building would show its name twice, once at the pin and once at the
// basemap's centroid.
//
// Mapbox's 3D buildings are switched off too, everywhere: outside the campus
// stays flat (Standard then draws its flat 2d-building footprints), and the
// campus's own buildings are drawn in 3D by our campus-buildings layer.
function applyLabelConfig(map) {
  try {
    map.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
    map.setConfigProperty('basemap', 'show3dBuildings', false)
  } catch {
    // Not a Standard-style map - nothing to configure.
  }
}

// Reads whatever building/POI/place Mapbox's own data already has at a
// clicked point - used to pre-fill a new campus area/storage/venue's name
// instead of asking the admin to type it from scratch (they can still edit
// it before saving). `point` is pixel coordinates (a MapMouseEvent's
// `.point`, not `.lngLat`) - queryRenderedFeatures reads the screen, not the
// globe. Returns null when nothing named is under the click (e.g. open grass).
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
  // Trees the building check has already looked at / thrown out, keyed by
  // position so they survive the deterministic re-generation on every data
  // change (see the trees effect).
  const treeCheckedRef = useRef(new Set())
  const treeRejectedRef = useRef(new Set())
  const [mapLoaded, setMapLoaded] = useState(false)
  // Guards the flat-to-tilted intro animation so it only ever plays once per
  // real page load - without this, it would replay every time `facilities`
  // changes (e.g. toggling "Show Buildings"), since that's the same effect
  // this camera sequencing lives in.
  const introPlayedRef = useRef(false)

  // Light/dark map, picked in MapThemeToggle: 'auto' (by the clock), 'light'
  // or 'dark'. Saved per browser so the choice survives reloads.
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
    } catch {
      // private browsing / storage disabled - the choice just won't persist
    }
    const map = mapRef.current
    if (map && mapLoaded) applyLightPreset(map, themeMode)
  }, [themeMode, mapLoaded])

  // Read inside the persistent 'click' listener below (attached once, in the
  // map-lifecycle effect) - refs so that listener always sees the current
  // values instead of whatever they were on first attach.
  const placementModeRef = useRef(placementMode)
  placementModeRef.current = placementMode
  const onPlacementClickRef = useRef(onPlacementClick)
  onPlacementClickRef.current = onPlacementClick
  // The facility a new storage/venue is being placed on (null when placing a
  // campus area itself) - its geofence limits where the click may land.
  const placementFacility =
    placementFacilityId != null
      ? allFacilities.find((f) => f.id === placementFacilityId && isInteractiveFacility(f)) ?? null
      : null
  const placementFacilityRef = useRef(placementFacility)
  placementFacilityRef.current = placementFacility
  // Why the last placement click was refused, shown in the placement banner.
  const [placementError, setPlacementError] = useState(null)
  const setPlacementErrorRef = useRef(setPlacementError)

  // Selection state lives here, not in the parent - only this component has
  // the actual Mapbox `map` instance needed to fly the camera to a point.
  // Only campus-area-typed markers are ever selectable now (see
  // buildMarkerElement), so `selected` is just the area itself - no more
  // kind discriminator, since there's nothing else it could be.
  // `selected` shape: { data, lngLat: [lng, lat] }.
  const [selected, setSelected] = useState(null)
  // Independent of `selected` itself - closing (X) clears both, but picking
  // a different marker while the sidebar's minimized keeps it minimized
  // rather than jumping back open on every click.
  const [minimized, setMinimized] = useState(false)
  // Which storage/venue row (if any) is drilled into within the selected
  // area - lifted up from AreaDetailsContent (rather than that component's
  // own local state) so the map can fly to its spot. Picked from the
  // sidebar's list.
  // Resets when a DIFFERENT area gets selected - not when the same area's
  // data merely refreshes after an edit.
  const [subItem, setSubItem] = useState(null)
  const selectedAreaKey = selected ? selectKey(selected.data) : null
  useEffect(() => {
    setSubItem(null)
  }, [selectedAreaKey])

  // Manually repositioning a pin ("Move pin" in the details panel): a
  // draggable pin stands in for the item's marker; drag it, or click the map
  // to jump it there, then save. `moving` = { item, lngLat, serverError,
  // saving } or null. The same rule the backend enforces is checked live:
  // a location must stay inside its campus boundary, a storage/venue inside
  // its location's geofence (shown while moving).
  // Direction of each campus's street grid (see campusGridAngle), by branch
  // id - every geofence rectangle is lined up with it. A storage/venue uses
  // its location's campus.
  const gridAngles = useMemo(() => {
    const angles = new Map()
    for (const campus of campuses) {
      let ring = null
      try {
        ring = closeRing(JSON.parse(campus.boundaryJson))
      } catch {
        // Malformed boundary - that campus falls back to north-up.
      }
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
  // Read by the placement click handler, which is attached once.
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
    // Out of the way of the map while dragging; the panel comes back after.
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
  // Keeps an open item's details fresh after an edit, and closes them if it
  // was deleted - `subItem` is a snapshot taken when it was picked.
  useEffect(() => {
    if (!subItem) return
    const fresh = allFacilities.find((f) => f.id === subItem.id && f.type === subItem.type)
    if (fresh !== subItem) setSubItem(fresh ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFacilities])

  // Tells the parent whenever something here becomes selected/deselected -
  // index.jsx uses this to auto-close the filter nav the instant a marker's
  // clicked, so the two right-docked panels (this sidebar and the filter
  // nav) never show stacked on top of each other at once.
  useEffect(() => {
    onSelectionActiveChange?.(!!selected)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  // Map lifecycle - created once on mount, torn down on unmount. The explicit
  // .remove() matters because StrictMode double-invokes effects in dev; without
  // it the first mount's map instance leaks and a second gets created in the
  // same container underneath it (the same class of bug the login loader hit
  // earlier in this project, from an effect with no cleanup).
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      // Starts flat (pitch 0) on purpose - the intro sequence below shows a
      // normal top-down overview first, then animates into the tilted 3D
      // view. fill-extrusion layers (the 3D buildings) only actually read as
      // 3D once pitched; at 0 an extrusion's sides are invisible.
      pitch: 0,
      // Mapbox allows tilting to 85deg, where the view looks along the ground
      // and every far-off pin projects onto the same thin horizon band - all
      // their labels pile into one unreadable smear. 60 matches the steepest
      // angle this page ever animates to itself (flyToAndSelect).
      maxPitch: 60,
      // Collapses the long "© Mapbox © OpenStreetMap" strip into a small (i) button.
      // Mapbox's terms require the logo and attribution to stay available, so
      // it's compacted rather than removed.
      attributionControl: false,
    })
    mapRef.current = map

    // Google Maps-style zoom in/out control - no compass/pitch-reset button,
    // just the two stacked +/- buttons. top-left because it's the one corner
    // nothing else on this page ever docks to (the filter toggle/nav sit
    // bottom-right and right-0 respectively) - a bottom or right position
    // would end up hidden behind those at some point.
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

    // Mapbox measures the container once at construction and draws its
    // internal <canvas> at that size - it does NOT auto-detect later size
    // changes. This page's container isn't at its final size yet when the
    // map is created (AdminPageShell's loading skeleton -> fade-in swap, plus
    // the calc(100vh-...) height only resolving once real layout settles), so
    // without this the canvas stays locked to an earlier, smaller size while
    // the surrounding <div> is correctly sized - visible as a gray gap of
    // empty div around an undersized map. ResizeObserver catches every
    // subsequent resize too (browser window, sidebar toggling, DevTools).
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    // "Realtime" day/night - re-checks periodically so a page left open
    // across the actual day/night boundary updates the light preset live,
    // not just once at load (only matters in 'auto' - see MapThemeToggle).
    // 10 minutes is frequent enough to feel real without constantly
    // touching config properties for no reason.
    const lightIntervalId = window.setInterval(() => applyLightPreset(map, themeModeRef.current), 10 * 60 * 1000)

    // Placement mode (e.g. "click the map to place a new storage area") -
    // this is a plain, layer-less click handler, so it only ever fires for
    // clicks that land on empty map canvas (a click on a marker or the
    // campus fill is captured by that element/layer first and never reaches
    // this one). Guarded by the ref so it's a no-op whenever placement mode
    // isn't actually active, without needing to add/remove this listener
    // every time that toggles. Also reads whatever Mapbox already has named
    // at that exact point (a real building/POI) so the add-storage/venue/area
    // modal can open with its name pre-filled instead of blank, plus the
    // building's outline + height that a new facility is saved with.
    //
    // When placing a storage/venue on a facility: a click on the facility's
    // 3D building is read at its roof height, so the pin lands exactly where
    // the roof was clicked (Mapbox's own e.lngLat is the ground BEHIND a tall
    // building at a tilt); any other click is read on the ground - e.g. in
    // the yellow geofence band around the building. A click outside the
    // facility's geofence is refused with a message instead of opening the
    // form; the backend checks the same rule on save.
    const handlePlacementClick = (e) => {
      // While moving a pin, a map click jumps the stand-in pin there.
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

  // Decorative 3D trees, drawn from the hand-made public/trees.geojson (see
  // trees.js for the Point / row / grove format). Mapbox's own buildings can't
  // be read outside the screen, so each generated (row/grove) tree is checked
  // once, the first time it's on screen with the camera at rest: if a
  // building's footprint contains it, it's dropped for good. Explicitly placed
  // Point trees are never dropped - you put them there on purpose.
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

  // The campus in 3D, everything else flat: Mapbox's 3D buildings are off
  // (see applyLabelConfig), and this layer re-draws only the buildings inside
  // the campus, from Mapbox's own building data and heights. Rebuilt as
  // building tiles load (at most once per frame); setData is skipped when
  // nothing changed so panning around doesn't keep re-uploading it.
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
        // Same draw position Standard's own 3D buildings use.
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
    // Backstop for anything the tile event missed (and the only path if the
    // tile-level read in loadedBasemapBuildings is ever unavailable).
    map.on('idle', scheduleRebuild)
    return () => {
      if (frame != null) window.cancelAnimationFrame(frame)
      map.off('sourcedata', onSourceData)
      map.off('idle', scheduleRebuild)
    }
  }, [mapLoaded, campuses, facilities])

  // Crosshair while placement mode is active, so it's visually obvious the
  // next click means something different than usual.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    map.getCanvas().style.cursor = placementMode ? 'crosshair' : ''
  }, [mapLoaded, placementMode])

  // Shows one geofence on the ground, under the 3D buildings: the selected
  // location's (or, while placing/moving a storage/venue, that of the
  // location it belongs to) - its rectangle, in yellow. Storage and venues
  // have no geofence of their own: they share their location's, so opening
  // one keeps showing the location's.
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
      // Ground layers, under the campus's 3D buildings (see groundLayerBefore).
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
    // Colors come from each feature - re-applied so layers created by older
    // code (kept alive across a dev hot reload) pick that up too.
    map.setPaintProperty(GEOFENCE_FILL_LAYER_ID, 'fill-color', ['get', 'fill'])
    map.setPaintProperty(GEOFENCE_EDGE_LAYER_ID, 'line-color', ['get', 'edge'])
  }, [mapLoaded, placementFacility, geofenceFacility])

  // The draggable stand-in pin while moving: same look as the item's own
  // marker, but on the ground (Mapbox drags markers along the ground, so a
  // pin lifted to a roof would jump under the cursor). Once saved, a rooftop
  // item is shown on its roof again, right above the saved spot.
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
  // A map click moves the stand-in pin too (see handlePlacementClick).
  useEffect(() => {
    if (moving && moveMarkerRef.current) moveMarkerRef.current.setLngLat(moving.lngLat)
  }, [moving])

  // Opening a storage/venue (from the sidebar's list or its tag) glides the
  // camera to it. A tag on a tall building sits at the roof, so the camera
  // backs off with height to keep it in view - same rule as flyToAndSelect.
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
    // Keyed on the item's identity, so refreshed data after an edit doesn't
    // re-fly the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, subItemKey])

  // Boundary layer(s) + markers - runs once the map has finished its own
  // internal load AND the campus/facility data has arrived from the API,
  // whichever happens second.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    // Only the intro's step-2 setTimeout needs cleanup (a source/layer add is
    // a one-shot synchronous call, nothing to cancel) - captured here so the
    // effect's cleanup below can clear it if the page unmounts mid-delay.
    let introTimeoutId = null
    let startIntroTilt = null

    // Click-to-view for a campus-area marker: flies the camera in close and
    // pitched toward the point ("facing" it) rather than just popping the
    // details straight up, then opens the docked sidebar once the fly
    // finishes. Gating placement mode here means clicking an existing marker
    // while placing a new storage point doesn't also pop open its details.
    function flyToAndSelect(data, lngLat, altitude = 0) {
      if (placementModeRef.current || movingRef.current) return
      // Selects immediately instead of waiting for the flyTo's 'moveend' -
      // that previous gating made the sidebar's appearance depend entirely on
      // how far the camera had to travel: near-instant for a marker already
      // close to center, a full ~1.5s wait for one further away. That
      // inconsistency read as some markers "working" (instant) and others
      // "broken" (had to hold/wait) - it was really just the same delay,
      // varying in length. The camera still flies to the point in the
      // background; the details panel no longer waits on it.
      setSelected({ data, lngLat })
      // Zoom 19 was tuned against a flat/short building. `center` is always a
      // ground-level point - Mapbox's camera has no "look at this altitude"
      // option in flyTo - so for a TALL building that same zoom+pitch puts
      // the camera essentially against its base wall, with the marker (which
      // sits at the rooftop - see the `altitude` marker option below) left
      // out of frame above/behind it. Backing the zoom off in proportion to
      // the building's real height pulls the camera far enough back that the
      // whole building, roof and marker included, stays in view regardless
      // of how tall it is.
      //
      // Capped at 1 level, not 2 - each zoom level roughly doubles the
      // visible ground area, so backing off further than that suddenly
      // exposes a lot more of the dense surrounding city that has to render
      // all at once mid-flight, which showed up as actual stutter/dropped
      // frames for a very tall building (confirmed: a longer duration didn't
      // help, because that wasn't a pacing problem - there was more work to
      // render than the animation, however long, could do smoothly). This is
      // a real tradeoff: a very tall building's roof may sit a little
      // further into frame-edge than a perfect fit, in exchange for the
      // motion actually completing smoothly instead of stuttering.
      const zoomPullback = Math.min(1, altitude / 60)
      // The intro sequence below calls setMinZoom() to permanently forbid
      // zooming out past the initial overview, for the rest of this map's
      // life. Backing off for a tall building can't be allowed to ask for
      // less than that floor - animating to an unreachable zoom doesn't error,
      // it just can't actually get there, and plays as "starts moving, then
      // snaps back to close to where it started" once the animation's clock
      // runs out. getMinZoom() reads whatever that floor currently is,
      // whether or not the intro has even run yet on this particular call.
      const targetZoom = Math.max(map.getMinZoom(), Math.max(map.getZoom(), 19) - zoomPullback)
      // A short building barely changes zoom at all, so 1500ms reads as a
      // normal, smooth fly-in. A tall one like Frassati can be backing off a
      // full 2 zoom levels on top of the same pan+pitch change - cramming
      // that much bigger a move into the exact same fixed duration is what
      // read as jerky/rushed, not a dropped-frames problem. Stretching the
      // duration out in proportion to how much zoom this particular building
      // actually needs keeps the motion at roughly the same felt speed
      // regardless of height, instead of the same time budget for a bigger job.
      const duration = 1500 + zoomPullback * 500
      // easeTo, not flyTo. flyTo's "arc" zooms OUT mid-flight and back in,
      // and near the overview that dip goes below the setMinZoom() floor.
      // Mapbox clamps the zoom but keeps panning as if the dip happened, so
      // the center lurches for the first few frames before the curve climbs
      // back above the floor - the glitch-then-smooth seen on tall buildings,
      // whose lower target zoom starts the curve right next to that floor.
      // Every move here stays inside one campus (setMaxBounds), so the arc
      // was never buying anything; easeTo moves zoom straight from start to
      // target and never touches the floor.
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
      if (coords.length < 4) return // not enough points for a real polygon ring

      const geojson = {
        type: 'Feature',
        properties: { name: campus.name },
        geometry: { type: 'Polygon', coordinates: [coords] },
      }

      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(geojson)
        return
      }

      // One source, two layers referencing it - the core Mapbox GL mental
      // model: the source just holds data, layers decide how to paint it.
      // Slot 'middle' keeps both on the ground under the 3D buildings -
      // without a slot they're drawn over the finished scene and tint
      // whatever building happens to overlap the campus on screen.
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

      // Deliberately not interactive - only facility/venue/storage markers
      // are clickable for viewing details. The campus boundary click-to-view
      // (fly-to-centroid + sidebar) used to live here; removed so clicking
      // anywhere inside the polygon doesn't trigger an unwanted camera jump
      // while you're just navigating the map or reaching for a marker.
    })

    // Darkens the flat area outside the campus (roads, blocks, building
    // footprints) so the campus reads as the focus - see
    // buildCampusMaskFeature. Slot 'middle' draws it under the 3D
    // buildings: with no valid slot (this used to say 'land', which Standard
    // doesn't have) it was drawn over the finished 3D scene as a flat sheet,
    // graying any campus building that stood in front of outside ground on
    // screen - e.g. the upper floors of Frassati.
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

    // Intro sequence, plays exactly once per page load (guarded by
    // introPlayedRef, not by this effect's own dependencies): an instant flat
    // top-down overview covering every campus/zone COMBINED (not just the
    // first one - a second zone drawn elsewhere would otherwise get cut off
    // by a pan lock/framing based on only the first), then a pure tilt-reveal
    // into the 3D view - same center and zoom as step 1, only pitch animates.
    if (campuses.length > 0 && !introPlayedRef.current) {
      const allRealCoords = []
      const allTightCoords = []
      for (const campus of campuses) {
        try {
          const c = closeRing(JSON.parse(campus.boundaryJson))
          if (c.length >= 4) {
            allRealCoords.push(...c)
            // The boundary fill/line layers above are rendered from each
            // campus's real, unmodified coordinates - this shrunk version is
            // only used for the intro's camera framing, to force a closer
            // fit than "exactly fit the real shapes" (padding: 0) would give.
            allTightCoords.push(...insetRing(c, 0.5))
          }
        } catch {
          // Malformed boundary JSON for this one campus - skip it, the
          // others still count toward the combined framing.
        }
      }

      if (allRealCoords.length > 0) {
        const tightBounds = allTightCoords.reduce(
          (b, [lng, lat]) => b.extend([lng, lat]),
          new mapboxgl.LngLatBounds(allTightCoords[0], allTightCoords[0]),
        )

        // Step 1: instant, flat, normal-looking overview.
        map.fitBounds(tightBounds, { pitch: 0, bearing: 0, padding: 0, duration: 0 })

        // Pan boundary - dragging can't go past the combined real (un-inset)
        // extent of every campus/zone, padded out a bit so nothing sits flush
        // against the edge of where you're allowed to pan to. maxBounds also
        // implicitly caps zoom-out at the level where these bounds fill the
        // screen - which CAN be tighter than fitBounds' framing (see below).
        const realBounds = allRealCoords.reduce(
          (b, [lng, lat]) => b.extend([lng, lat]),
          new mapboxgl.LngLatBounds(allRealCoords[0], allRealCoords[0]),
        )
        // Tightened from an earlier 0.3 - less of the surrounding city is
        // even reachable now that Standard style's own dense city buildings
        // are visible around the campus, so there's less to pan into anyway.
        const padLng = (realBounds.getEast() - realBounds.getWest()) * 0.15
        const padLat = (realBounds.getNorth() - realBounds.getSouth()) * 0.15
        map.setMaxBounds([
          [realBounds.getWest() - padLng, realBounds.getSouth() - padLat],
          [realBounds.getEast() + padLng, realBounds.getNorth() + padLat],
        ])

        // Read the framing only AFTER setMaxBounds. When the screen's shape
        // doesn't match the campus's (a wide monitor vs. a squarish campus),
        // fitBounds' view shows more than maxBounds allows, and setMaxBounds
        // immediately zooms in / re-centers to fit. Capturing before that meant
        // the tilt below animated toward a zoom maxBounds forbids - Mapbox
        // re-clamped it every frame, which read as the intro jittering - and
        // the zoom floor was set lower than the map could actually reach.
        const introCenter = map.getCenter()
        const introZoom = map.getZoom()

        // Zoom-out floor - can't zoom out past this initial framing, but
        // zooming in further is still completely free.
        map.setMinZoom(introZoom)

        // Step 2: after a beat, animate ONLY pitch (0 -> 45) at that exact
        // same center/zoom - a pure tilt, not also a zoom change, which is
        // what made an earlier version feel like it was doing two things at
        // once instead of one smooth reveal.
        //
        // The "beat" is counted from the first 'idle' (the flat overview's
        // tiles actually drawn), not from 'load' - on a slow refresh a fixed
        // timer could spend the whole tilt on a still-blank map. And
        // introPlayedRef is only set once the tilt really starts: it used to
        // be set up front, so if this effect re-ran during the wait (its
        // cleanup cancels the pending tilt), the re-run saw "already played"
        // and skipped it - leaving the map stuck flat until a lucky reload.
        startIntroTilt = () => {
          introTimeoutId = window.setTimeout(() => {
            introPlayedRef.current = true
            map.easeTo({ center: introCenter, zoom: introZoom, pitch: 45, bearing: 0, duration: 2200 })
          }, 900)
        }
        map.once('idle', startIntroTilt)
      }
    }

    // Our own 3D blocks, only for facilities whose height was corrected by
    // hand (see facilityFootprintFeature) - everything else is Mapbox's.
    const buildingsSourceId = 'facility-buildings'
    const buildingsGeojson = {
      type: 'FeatureCollection',
      features: facilities.map(facilityFootprintFeature).filter(Boolean),
    }
    if (map.getSource(buildingsSourceId)) {
      map.getSource(buildingsSourceId).setData(buildingsGeojson)
      // Re-applied so a layer created by older code (e.g. kept alive across
      // a dev hot reload) can't keep painting a stale look.
      Object.entries(CAMPUS_BUILDING_PAINT).forEach(([prop, value]) => map.setPaintProperty(OVERRIDE_LAYER_ID, prop, value))
    } else {
      map.addSource(buildingsSourceId, { type: 'geojson', data: buildingsGeojson })
      map.addLayer({
        id: OVERRIDE_LAYER_ID,
        type: 'fill-extrusion',
        source: buildingsSourceId,
        // Same draw position as Standard's own 3D buildings, so it's lit and
        // layered exactly like its neighbors.
        slot: 'middle',
        layout: { 'fill-extrusion-edge-radius': 0.4 },
        paint: CAMPUS_BUILDING_PAINT,
      })
    }

    // Markers are cleared and rebuilt on every change rather than diffed -
    // simpler, and fine at this scale. Altitude is the row's saved height, so
    // a rebuild always puts each pin back at the exact same spot. Only
    // locations get markers; their storage/venue counts (from the UNFILTERED
    // list) ride on each pin's badge.
    const embeddedCounts = countEmbedded(allFacilities)
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = facilities.filter(hasMarker).map((facility) =>
      new mapboxgl.Marker({
        element: buildMarkerElement(facility, embeddedCounts.get(facility.id) ?? { storage: 0, venue: 0 }, (f) =>
          flyToAndSelect(f, [f.longitude, f.latitude], markerAltitude(f)),
        ),
        altitude: markerAltitude(facility),
        // The pin's tip is its location.
        anchor: 'bottom',
      })
        .setLngLat([facility.longitude, facility.latitude])
        .addTo(map),
    )

    // Pin labels are plain DOM, so unlike Mapbox's own symbol labels they get
    // no collision detection - at a tilt, pins that sit behind each other
    // along the view line stack their names into one smear. Nearest pin
    // (lowest on screen when pitched) keeps its label; any label overlapping
    // one already kept is hidden until the camera moves it clear again.
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
        if (rect.width === 0) continue // labels hidden below LABEL_MIN_ZOOM
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

  // Highlights the selected area's pin (the .map-pin[data-active] rules in
  // index.css), and hides the pin being moved - its draggable stand-in
  // replaces it. Declared after the markers effect so that, when both re-run
  // together, it updates the freshly rebuilt elements rather than the old ones.
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

  // The other direction of the single-panel rule above: index.jsx bumps
  // closeSignal when the filter nav opens, which should close whatever's
  // selected here. 0 is the initial value and never triggers this.
  useEffect(() => {
    if (closeSignal) handleCloseSelection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSignal])

  // Keeps the open sidebar's header (name/type/photo-derived icon) fresh
  // after an edit, and closes it entirely if the selected area no longer
  // exists in the data at all (e.g. deleted from elsewhere) - `selected.data`
  // is a snapshot captured at click time, not a live reference, so without
  // this an edit wouldn't be visible until the sidebar were reopened.
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

  // Delete-area additionally closes the sidebar on success (there's nothing
  // left to show); edit/delete-item just let AreaDetailsContent's own state
  // (subItem) and the resync effect above handle the rest.
  const handleDeleteAreaWrapped = async (id) => {
    const result = await onDeleteArea(id)
    if (result?.ok) handleCloseSelection()
    return result
  }

  // AdminPageShell renders this page fullBleed (no padding), so the only
  // thing left to subtract is Topbar's own height (h-16, lg:h-20) - this fills
  // every remaining pixel down to the viewport edge without overflowing it.
  // The sidebar is a sibling docked to this same wrapper's right edge, not
  // positioned relative to any particular point on the map.
  return (
    <div className="relative h-[calc(100vh-48px)] w-full overflow-hidden lg:h-[calc(100vh-57px)]">
      <div
        ref={containerRef}
        className={`h-full w-full transition-opacity duration-700 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Kept mounted (not conditionally rendered) so it fades out smoothly
          via opacity rather than just vanishing the instant mapLoaded flips -
          pointer-events-none once hidden so it doesn't swallow map clicks. */}
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
        // Placement instructions for a new storage/venue - left of the
        // right-docked details sidebar, which stays open during placement,
        // and stacked above it for narrow screens where the two overlap.
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
          // Keyed by the selected item so switching straight from one
          // marker to another (without closing first) still unmounts and
          // remounts this, replaying its entrance animation fresh instead
          // of silently updating in place - selection now applies
          // immediately (see flyToAndSelect) rather than via the old
          // "clear, wait for moveend, then set" sequence that used to
          // guarantee this same remount as a side effect.
          key={`${selected.data.type}-${selected.data.id}`}
          // Always the plain "Location Details" header now (no icon badge,
          // no color tint) - one consistent panel design for every kind of
          // location (area or drilled-into storage/venue item), matching
          // AreaDetailsContent's single shared LocationDetailsBody layout.
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
