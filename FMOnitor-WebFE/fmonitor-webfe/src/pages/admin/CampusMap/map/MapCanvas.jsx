import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { icon } from '@fortawesome/fontawesome-svg-core'
import { FACILITY_TYPE_STYLES, CAMPUS_AREA_TYPES } from '../facilityTypes'
import DetailsSidebar from '../panels/DetailsSidebar'
import AreaDetailsContent from '../panels/AreaDetailsContent'
import MapLoadingOverlay from './MapLoadingOverlay'
import MapLegend from './MapLegend'
import { generateTrees, treesToGeoJSON, ringContains } from './trees'

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

// Our own 3D blocks (see facilityFootprintFeature) copy Standard style's
// `3d-building` layer: same color expression, read from the basemap's own
// `colorBuildings` config, plus its rounded edges, ground shading and night
// flood light - so a corrected building looks exactly like its neighbors in
// every light preset, with nothing to keep in sync by hand.
const OVERRIDE_LAYER_ID = 'facility-buildings-extrusion'
const basemapBuildingHsla = (i) => ['at', i, ['to-hsla', ['config', 'colorBuildings', 'basemap']]]
const OVERRIDE_BLOCK_PAINT = {
  'fill-extrusion-color': [
    'hsl',
    ['max', 0, ['-', basemapBuildingHsla(0), 10]],
    ['min', 100, ['+', basemapBuildingHsla(1), 10]],
    basemapBuildingHsla(2),
  ],
  'fill-extrusion-height': ['get', 'height'],
  'fill-extrusion-base': 0,
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
// that isn't a building) - the pin sits at that height, on the roof.
function markerAltitude(facility) {
  return facility.height ?? 0
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

// Only campus-area-typed facilities (Building/Field/Gate/etc.) are
// independently clickable - Venue/Storage markers render as plain, inert
// pins. Their own details only ever show nested inside whichever campus
// area they're embedded in (see AreaDetailsContent) or via the general type
// filter making them visible at all; there's no per-marker click for them.
// Teardrop outline in a 32x42 box: round head centered at (16,16), tip at
// the bottom-center (16,41) - the tip is the exact spot the pin marks.
const PIN_PATH = 'M16 41C16 41 2 26.5 2 16a14 14 0 1 1 28 0c0 10.5-14 25-14 25Z'

// ids are only unique within a table, so selection is matched on type + id.
function selectKey(facility) {
  return `${facility.type}:${facility.id}`
}

function isInteractiveFacility(facility) {
  return CAMPUS_AREA_TYPES.includes(facility.type)
}

// Clickable areas get a map-pin (colored teardrop, white disc, icon in the
// type's color); inert Venue/Storage markers stay plain circles, so the
// shape itself tells you what can be clicked.
function buildPinElement(style) {
  const el = document.createElement('div')
  el.className = 'map-pin relative h-[42px] w-8 cursor-pointer'
  // Inner wrapper takes the hover shake / active grow (the .map-pin rules in
  // index.css) - Mapbox owns the outer element's own `transform` (that's how
  // it positions the marker), so they can't go there.
  const pin = document.createElement('div')
  pin.className = 'map-pin-body relative h-full w-full'
  pin.innerHTML = `
    <svg viewBox="0 0 32 42" width="32" height="42" style="display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.35))">
      <path d="${PIN_PATH}" fill="${style.color}" stroke="#fff" stroke-width="1.5" />
      <circle cx="16" cy="16" r="9.5" fill="#fff" />
    </svg>
    <span class="absolute left-4 top-4 flex -translate-x-1/2 -translate-y-1/2" style="color:${style.color}">${icon(style.icon).html[0]}</span>
  `
  const iconSvg = pin.querySelector('span svg')
  if (iconSvg) {
    iconSvg.style.width = '11px'
    iconSvg.style.height = '11px'
  }
  el.appendChild(pin)
  return el
}

function buildCircleElement(style) {
  const el = document.createElement('div')
  // text-white here isn't decorative - the FontAwesome SVG below fills with
  // currentColor, so this is what actually makes the icon white.
  el.className = `flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-md ${style.bgClass}`
  el.innerHTML = icon(style.icon).html[0]
  const svg = el.querySelector('svg')
  if (svg) {
    svg.style.width = '14px'
    svg.style.height = '14px'
  }
  return el
}

function buildMarkerElement(facility, onSelectFacility) {
  const style = FACILITY_TYPE_STYLES[facility.type] ?? FACILITY_TYPE_STYLES.Venue
  const interactive = isInteractiveFacility(facility)
  const el = interactive ? buildPinElement(style) : buildCircleElement(style)
  el.dataset.selectKey = selectKey(facility)
  if (interactive) {
    // Our own label, attached to the pin itself (hangs just below the icon)
    // so the icon and its name can never drift apart. The basemap's own POI
    // labels are turned off (see applyLabelConfig) - they sit at the
    // building's centroid while the pin sits at the facility's coordinates
    // (lifted to rooftop height), which is what left the icon floating far
    // from its label. Visibility (only when zoomed in) and color (dark by
    // day, light by night) come from the .facility-label rules in index.css,
    // driven by data attributes on the map container.
    const label = document.createElement('span')
    label.textContent = facility.name
    label.className = 'facility-label pointer-events-none absolute left-1/2 top-full mt-0.5 w-max max-w-[9rem] -translate-x-1/2 text-center text-[11px] font-semibold leading-tight'
    el.appendChild(label)
    el.addEventListener('click', (event) => {
      // Without this, Mapbox's own click-through-to-map handler fires too and
      // can close whatever this click was meant to open.
      event.stopPropagation()
      onSelectFacility(facility)
    })
  }
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

function applyLightPreset(map) {
  map.getContainer().dataset.night = String(!isDaytime())
  try {
    map.setConfigProperty('basemap', 'lightPreset', isDaytime() ? 'day' : 'night')
  } catch {
    // Not a Standard-style map (e.g. a custom Studio style) - no light preset
    // config to set, nothing to do.
  }
}

// Standard's own POI icons+labels are hidden so each campus area's pin
// carries its own label instead (see buildMarkerElement) - otherwise every
// building would show its name twice, once at the pin and once at the
// basemap's centroid.
function applyLabelConfig(map) {
  try {
    map.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
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
  onPlacementClick,
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

  // Read inside the persistent 'click' listener below (attached once, in the
  // map-lifecycle effect) - refs so that listener always sees the current
  // values instead of whatever they were on first attach.
  const placementModeRef = useRef(placementMode)
  placementModeRef.current = placementMode
  const onPlacementClickRef = useRef(onPlacementClick)
  onPlacementClickRef.current = onPlacementClick

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
  // own local state) so this component can swap DetailsSidebar's header
  // between "area" and "item" modes (see the render below). Resets whenever
  // the selection itself changes, same as it would have on remount before.
  const [subItem, setSubItem] = useState(null)
  useEffect(() => {
    setSubItem(null)
  }, [selected])

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
      applyLightPreset(map)
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
    // not just once at load. 10 minutes is frequent enough to feel real
    // without constantly touching config properties for no reason.
    const lightIntervalId = window.setInterval(() => applyLightPreset(map), 10 * 60 * 1000)

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
    const handlePlacementClick = (e) => {
      if (placementModeRef.current) {
        const detectedName = detectPlaceNameAt(map, e.point)
        const detectedShape = detectBuildingShapeAt(map, e.point, e.lngLat.lng, e.lngLat.lat)
        onPlacementClickRef.current?.([e.lngLat.lng, e.lngLat.lat], detectedName, detectedShape)
      }
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

  // Crosshair while placement mode is active, so it's visually obvious the
  // next click means something different than usual.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    map.getCanvas().style.cursor = placementMode ? 'crosshair' : ''
  }, [mapLoaded, placementMode])

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
      if (placementModeRef.current) return
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
      map.addSource(sourceId, { type: 'geojson', data: geojson })
      map.addLayer({
        id: `${sourceId}-fill`,
        type: 'fill',
        source: sourceId,
        paint: { 'fill-color': '#fccb35', 'fill-opacity': 0.15 },
      })
      map.addLayer({
        id: `${sourceId}-line`,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': '#fccb35', 'line-width': 2 },
      })

      // Deliberately not interactive - only facility/venue/storage markers
      // are clickable for viewing details. The campus boundary click-to-view
      // (fly-to-centroid + sidebar) used to live here; removed so clicking
      // anywhere inside the polygon doesn't trigger an unwanted camera jump
      // while you're just navigating the map or reaching for a marker.
    })

    // Dims everything outside the campus (surrounding city buildings, roads,
    // labels) so the campus itself reads as the visual focus instead of
    // blending into the dense city around it - see buildCampusMaskFeature.
    // `slot: 'land'` is Standard style's ground-level compositing slot (sits
    // on the terrain, below buildings/labels) - `slot: 'top'` was tried
    // first but composites ABOVE the whole 3D scene instead of on the
    // ground, which reads as a flat gray plane floating in front of
    // everything at a steep pitch instead of tinting the ground itself. A
    // non-Standard style just ignores an unknown slot and stacks it in
    // insertion order like any other layer.
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
        slot: 'land',
        paint: { 'fill-color': '#4b4b4b', 'fill-opacity': 0.55 },
      })
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
      Object.entries(OVERRIDE_BLOCK_PAINT).forEach(([prop, value]) => map.setPaintProperty(OVERRIDE_LAYER_ID, prop, value))
    } else {
      map.addSource(buildingsSourceId, { type: 'geojson', data: buildingsGeojson })
      map.addLayer({
        id: OVERRIDE_LAYER_ID,
        type: 'fill-extrusion',
        source: buildingsSourceId,
        // Same draw position as Standard's own 3D buildings. Without a slot
        // the block is drawn after everything else - after the campus
        // boundary's translucent yellow fill, which tints every Mapbox
        // building but would miss this one, leaving it visibly bluer.
        slot: 'middle',
        layout: { 'fill-extrusion-edge-radius': 0.4 },
        paint: OVERRIDE_BLOCK_PAINT,
      })
    }

    // Markers are cleared and rebuilt on every change rather than diffed -
    // simpler, and fine at this scale. Altitude is the row's saved height, so
    // a rebuild always puts each pin back at the exact same spot.
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = facilities.map((facility) =>
      new mapboxgl.Marker({
        element: buildMarkerElement(facility, (f) => flyToAndSelect(f, [f.longitude, f.latitude], markerAltitude(f))),
        altitude: markerAltitude(facility),
        // A pin's tip is its location, so it sits on the point rather than
        // being centered over it the way the plain circles are.
        anchor: isInteractiveFacility(facility) ? 'bottom' : 'center',
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
  }, [mapLoaded, campuses, facilities])

  // Highlights the selected area's pin (the .map-pin[data-active] rules in
  // index.css). Declared after the markers effect so that, when both re-run
  // together, it marks the freshly rebuilt elements rather than the old ones.
  useEffect(() => {
    const activeKey = selected ? selectKey(selected.data) : null
    markersRef.current.forEach((marker) => {
      const el = marker.getElement()
      el.dataset.active = String(el.dataset.selectKey === activeKey)
    })
  }, [selected, mapLoaded, campuses, facilities])

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
          />
        </DetailsSidebar>
      )}
    </div>
  )
}

export default MapCanvas
