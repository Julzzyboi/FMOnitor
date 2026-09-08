import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { icon } from '@fortawesome/fontawesome-svg-core'
import { FACILITY_TYPE_STYLES, CAMPUS_AREA_TYPES } from './rowStyles'
import DetailsSidebar from './DetailsSidebar'
import AreaDetailsContent from './AreaDetailsContent'
import MapLoadingOverlay from './MapLoadingOverlay'

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

// Default extrusion height when a facility hasn't set its own.
const DEFAULT_BUILDING_HEIGHT = 15

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

// Builds this facility's own 3D extrusion feature directly from its
// footprintJson - a real polygon drawn and supplied by an admin (same
// geojson.io workflow as the campus boundary), not guessed by matching
// third-party OSM data. Returns null when a facility has no footprint set at
// all, which just means it renders as a flat marker with no block.
function facilityFootprintFeature(facility) {
  if (!facility.footprintJson) return null
  let ring
  try {
    ring = closeRing(JSON.parse(facility.footprintJson))
  } catch {
    return null
  }
  if (ring.length < 4) return null
  return {
    type: 'Feature',
    properties: {
      color: FACILITY_TYPE_STYLES[facility.type]?.color ?? FACILITY_TYPE_STYLES.Venue.color,
      height: facility.height ?? DEFAULT_BUILDING_HEIGHT,
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  }
}

// Mapbox's own Standard-style 3D buildings have a real rooftop height per
// building, but it's THEIR data - we don't control or store it. A `Marker`
// always sits at ground level (altitude 0) unless told otherwise, which is
// why a pin next to a tall building looks disconnected from its roof. This
// reads whatever height Mapbox is actually rendering at that exact ground
// point (its `building` featureset's own `height`/`render_height`, in
// meters) so the marker's `altitude` option (see MarkerOptions - handled
// natively by Mapbox's own 3D renderer, correct at any pitch/zoom with no
// per-frame math needed here) can put it at the real rooftop instead.
// Returns 0 (ground level) when nothing tall is rendered there yet - the
// correct behavior for genuinely flat ground anyway (a field, a plaza).
function getGroundBuildingHeight(map, lngLat) {
  const point = map.project(lngLat)
  const features = map.queryRenderedFeatures(point)
  let maxHeight = 0
  for (const feature of features) {
    const height = feature.properties?.height ?? feature.properties?.render_height
    if (typeof height === 'number' && height > maxHeight) {
      maxHeight = height
    }
  }
  return maxHeight
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
function buildMarkerElement(facility, onSelectFacility) {
  const style = FACILITY_TYPE_STYLES[facility.type] ?? FACILITY_TYPE_STYLES.Venue
  const interactive = CAMPUS_AREA_TYPES.includes(facility.type)
  const el = document.createElement('div')
  // text-white here isn't decorative - the FontAwesome SVG below fills with
  // currentColor, so this is what actually makes the icon white.
  el.className = `flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-white shadow-md ${style.bgClass} ${interactive ? 'cursor-pointer' : ''}`
  el.innerHTML = icon(style.icon).html[0]
  const svg = el.querySelector('svg')
  if (svg) {
    svg.style.width = '14px'
    svg.style.height = '14px'
  }
  if (interactive) {
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

function applyLightPreset(map) {
  try {
    map.setConfigProperty('basemap', 'lightPreset', isDaytime() ? 'day' : 'night')
  } catch {
    // Not a Standard-style map (e.g. a custom Studio style) - no light preset
    // config to set, nothing to do.
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
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
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
    })
    mapRef.current = map
    map.on('load', () => {
      applyLightPreset(map)
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
    // modal can open with its name pre-filled instead of blank.
    const handlePlacementClick = (e) => {
      if (placementModeRef.current) {
        const detectedName = detectPlaceNameAt(map, e.point)
        onPlacementClickRef.current?.([e.lngLat.lng, e.lngLat.lat], detectedName)
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

    // Click-to-view for a campus-area marker: flies the camera in close and
    // pitched toward the point ("facing" it) rather than just popping the
    // details straight up, then opens the docked sidebar once the fly
    // finishes. Gating placement mode here means clicking an existing marker
    // while placing a new storage point doesn't also pop open its details.
    function flyToAndSelect(data, lngLat) {
      if (placementModeRef.current) return
      // Whatever's currently shown closes the instant a different marker's
      // clicked, rather than lingering through the ~1.5s flight to the new
      // one - unmounts DetailsSidebar right away (see the render below), and
      // the fresh mount once moveend fires plays its entrance animation for
      // the new area same as any other first-time open.
      setSelected(null)
      map.flyTo({
        center: lngLat,
        zoom: Math.max(map.getZoom(), 19),
        pitch: 60,
        duration: 1500,
        essential: true,
      })
      map.once('moveend', () => setSelected({ data, lngLat }))
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
        paint: { 'fill-color': '#0b1220', 'fill-opacity': 0.55 },
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
        introPlayedRef.current = true

        const tightBounds = allTightCoords.reduce(
          (b, [lng, lat]) => b.extend([lng, lat]),
          new mapboxgl.LngLatBounds(allTightCoords[0], allTightCoords[0]),
        )

        // Step 1: instant, flat, normal-looking overview.
        map.fitBounds(tightBounds, { pitch: 0, bearing: 0, padding: 0, duration: 0 })
        const introCenter = map.getCenter()
        const introZoom = map.getZoom()

        // Zoom-out floor - can't zoom out past this initial framing, but
        // zooming in further is still completely free.
        map.setMinZoom(introZoom)

        // Pan boundary - dragging can't go past the combined real (un-inset)
        // extent of every campus/zone, padded out a bit so nothing sits flush
        // against the edge of where you're allowed to pan to. This is
        // independent of the zoom floor above (setMinZoom), not tangled with
        // it the way setMaxBounds alone would be - maxBounds implicitly caps
        // zoom-out too, but only at the level where these wider bounds fill
        // the screen, which is looser than introZoom already is, so it never
        // actually becomes the binding constraint for zoom.
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

        // Step 2: after a beat, animate ONLY pitch (0 -> 45) at that exact
        // same center/zoom - a pure tilt, not also a zoom change, which is
        // what made an earlier version feel like it was doing two things at
        // once instead of one smooth reveal.
        introTimeoutId = window.setTimeout(() => {
          map.easeTo({ center: introCenter, zoom: introZoom, pitch: 45, bearing: 0, duration: 2200 })
        }, 900)
      }
    }

    // 3D building extrusions - each facility's own footprintJson (a real
    // polygon an admin drew and supplied), colored/sized from that facility's
    // own color/height. Purely derived from our own data - no async tile
    // loading to wait on, unlike matching against Mapbox's OSM building data.
    const buildingsSourceId = 'facility-buildings'
    const buildingsGeojson = {
      type: 'FeatureCollection',
      features: facilities.map(facilityFootprintFeature).filter(Boolean),
    }
    if (map.getSource(buildingsSourceId)) {
      map.getSource(buildingsSourceId).setData(buildingsGeojson)
    } else {
      map.addSource(buildingsSourceId, { type: 'geojson', data: buildingsGeojson })
      const firstSymbolLayer = map.getStyle().layers.find((l) => l.type === 'symbol')
      map.addLayer(
        {
          id: `${buildingsSourceId}-extrusion`,
          type: 'fill-extrusion',
          source: buildingsSourceId,
          paint: {
            // Data-driven styling - each feature's own color/height properties
            // (set in facilityFootprintFeature, per facility) drive the
            // paint, not one fixed value.
            'fill-extrusion-color': ['get', 'color'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9,
          },
        },
        firstSymbolLayer?.id,
      )
    }

    // Markers are cleared and rebuilt on every change rather than diffed -
    // simpler, and fine at this scale (a handful of buildings, not thousands).
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = facilities.map((facility) => {
      const lngLat = [facility.longitude, facility.latitude]
      // Sits on top of the facility's own admin-drawn extrusion when it has
      // one (same height that extrusion itself renders at - see
      // facilityFootprintFeature/DEFAULT_BUILDING_HEIGHT), otherwise reads
      // whatever real building Mapbox is already rendering at that ground
      // point so the pin lands on its actual rooftop instead of the ground.
      const altitude = facility.footprintJson
        ? (facility.height ?? DEFAULT_BUILDING_HEIGHT)
        : getGroundBuildingHeight(map, lngLat)
      return new mapboxgl.Marker({
        element: buildMarkerElement(facility, (f) => flyToAndSelect(f, [f.longitude, f.latitude])),
        altitude,
      })
        .setLngLat(lngLat)
        .addTo(map)
    })

    return () => {
      if (introTimeoutId) window.clearTimeout(introTimeoutId)
    }
  }, [mapLoaded, campuses, facilities])

  const handleCloseSelection = () => {
    setSelected(null)
    setMinimized(false)
  }

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
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden lg:h-[calc(100vh-80px)]">
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
      {selected && (() => {
        const style = FACILITY_TYPE_STYLES[selected.data.type] ?? FACILITY_TYPE_STYLES.Venue
        return (
          <DetailsSidebar
            icon={style.icon}
            accentColor={style.color}
            title={selected.data.name}
            subtitle={selected.data.type}
            minimized={minimized}
            onToggleMinimize={() => setMinimized((v) => !v)}
            onClose={handleCloseSelection}
          >
            <AreaDetailsContent
              area={selected.data}
              allFacilities={allFacilities}
              onEditArea={onEditArea}
              onDeleteArea={handleDeleteAreaWrapped}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onAddItem={(kind) => onAddEmbeddedItem(kind, selected.data.id)}
            />
          </DetailsSidebar>
        )
      })()}
    </div>
  )
}

export default MapCanvas
