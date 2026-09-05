import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { icon } from '@fortawesome/fontawesome-svg-core'
import { FACILITY_TYPE_STYLES } from './rowStyles'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// Rough UST España fallback - only ever shown for the single frame before the
// first campus loads and fitBounds() reframes to the real boundary below.
const DEFAULT_CENTER = [120.9894, 14.6091]
const DEFAULT_ZOOM = 20

// A Mapbox Studio style URL (mapbox://styles/<user>/<style-id>) once one
// exists - see the "customize the campus view" walkthrough. Falls back to a
// stock light style so the map still renders correctly before that's set up.
const MAP_STYLE = import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/light-v11'

// Every facility gets its own synthetic square footprint to extrude in 3D,
// rather than trying to match Mapbox's built-in OSM building polygons - that
// would depend on undocumented internal feature ids that can shift across
// zoom levels/style changes, and would fight against "individually designed"
// anyway since we wouldn't own that geometry. This way color/height are
// fully ours to control, per facility.
const FOOTPRINT_SIZE_METERS = 20
const DEFAULT_BUILDING_HEIGHT = 15
const EARTH_RADIUS_M = 6378137

function footprintPolygon(lat, lng, sizeMeters) {
  const half = sizeMeters / 2
  const dLat = (half / EARTH_RADIUS_M) * (180 / Math.PI)
  const dLng = (half / (EARTH_RADIUS_M * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI)
  return [
    [lng - dLng, lat - dLat],
    [lng + dLng, lat - dLat],
    [lng + dLng, lat + dLat],
    [lng - dLng, lat + dLat],
    [lng - dLng, lat - dLat],
  ]
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

// Same ray-casting point-in-polygon test as the backend's GeofenceService
// (pure JS port, same algorithm) - used instead of Mapbox GL's own `within`
// style expression, which turned out to have some unresolved requirement
// (winding direction or otherwise) that silently matched zero buildings with
// no error either way it was tried. This version is winding-direction
// agnostic and easy to verify, since it's the same logic already proven to
// work for facility placement on the backend.
function pointInPolygon(lng, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lngI, latI] = ring[i]
    const [lngJ, latJ] = ring[j]
    const intersects = latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI
    if (intersects) inside = !inside
  }
  return inside
}

// A rendered building feature's geometry (Polygon or MultiPolygon, already
// reprojected to real lng/lat by Mapbox GL) reduced to one representative
// point - the average of its outer ring's vertices. Good enough to test
// "is this building inside the campus" without needing a true centroid.
function featureRepresentativePoint(feature) {
  const geom = feature.geometry
  let ring
  if (geom.type === 'Polygon') ring = geom.coordinates[0]
  else if (geom.type === 'MultiPolygon') ring = geom.coordinates[0]?.[0]
  if (!ring || ring.length === 0) return null
  const lngs = ring.map((c) => c[0])
  const lats = ring.map((c) => c[1])
  return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length]
}

// Recomputes which real OSM buildings currently loaded near the campus are
// actually inside its boundary, and updates the layer's filter to show only
// those - called once right after the layer's added, and again on every
// `moveend` since panning/zooming loads different building tiles over time.
function updateOsmBuildingsFilter(map, layerId, campusRing) {
  if (!map.getLayer(layerId)) return
  const features = map.querySourceFeatures('composite', {
    sourceLayer: 'building',
    filter: ['==', ['get', 'extrude'], 'true'],
  })
  const insideIds = []
  for (const feature of features) {
    const point = featureRepresentativePoint(feature)
    if (point && pointInPolygon(point[0], point[1], campusRing)) {
      insideIds.push(feature.id)
    }
  }
  map.setFilter(layerId, ['all', ['==', ['get', 'extrude'], 'true'], ['in', ['id'], ['literal', insideIds]]])
}

// boundaryJson is stored as [[lng,lat], ...] without necessarily repeating the
// first point at the end - a valid GeoJSON polygon ring must close on itself.
function closeRing(coords) {
  if (coords.length === 0) return coords
  const [firstLng, firstLat] = coords[0]
  const [lastLng, lastLat] = coords[coords.length - 1]
  return firstLng === lastLng && firstLat === lastLat ? coords : [...coords, coords[0]]
}

function buildMarkerElement(facility, onSelectFacility) {
  const style = FACILITY_TYPE_STYLES[facility.type] ?? FACILITY_TYPE_STYLES.Office
  const el = document.createElement('div')
  // text-white here isn't decorative - the FontAwesome SVG below fills with
  // currentColor, so this is what actually makes the icon white.
  el.className = `flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white text-white shadow-md ${style.bgClass}`
  el.innerHTML = icon(style.icon).html[0]
  const svg = el.querySelector('svg')
  if (svg) {
    svg.style.width = '14px'
    svg.style.height = '14px'
  }
  el.addEventListener('click', (event) => {
    // Without this, Mapbox's own click-through-to-map handler fires too and
    // can close whatever this click was meant to open.
    event.stopPropagation()
    onSelectFacility(facility)
  })
  return el
}

// The light style is deliberately grayscale/muted by default - this recolors
// its water and vegetation layers to real colors instead of switching the
// whole style (which would also change roads/labels/buildings we've already
// tuned). Targets layers by `source-layer` (the underlying vector tileset's
// schema name, stable across style revisions) rather than hardcoded layer
// ids, since a style's own layer ids/filters aren't part of its public API
// and can vary by version - source-layer names are the stable part.
function applyColorfulTheme(map) {
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'fill') continue
    if (layer['source-layer'] === 'water') {
      map.setPaintProperty(layer.id, 'fill-color', '#4a90d9')
    } else if (layer['source-layer'] === 'landcover') {
      // Landcover covers wood/grass/scrub/crop classes - real green fields
      // and trees instead of the style's default flat off-white/tan.
      map.setPaintProperty(layer.id, 'fill-color', '#8bc98b')
    } else if (layer['source-layer'] === 'landuse') {
      // Broader than just parks (also covers e.g. cemetery/hospital zones),
      // but a lighter green here reads fine for all of them at this zoom.
      map.setPaintProperty(layer.id, 'fill-color', '#a8d5a8')
    }
  }

  // A real sky - only actually visible once pitched (which the intro
  // animation already does), giving the daylight/atmosphere look instead of
  // a flat color or nothing above the horizon.
  if (!map.getLayer('sky')) {
    map.addLayer({
      id: 'sky',
      type: 'sky',
      paint: {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun-intensity': 10,
      },
    })
  }
}

function MapCanvas({ campuses, facilities, onSelectFacility, onSelectCampus }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapLoaded, setMapLoaded] = useState(false)
  // Guards the flat-to-tilted intro animation so it only ever plays once per
  // real page load - without this, it would replay every time `facilities`
  // changes (e.g. toggling "Show Buildings"), since that's the same effect
  // this camera sequencing lives in.
  const introPlayedRef = useRef(false)

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
      applyColorfulTheme(map)
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

    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

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

      // Click-to-view for the area itself, same pattern as facility markers -
      // this is what actually surfaces the campus's own database id, which
      // otherwise has no visible representation anywhere on the map.
      const fillLayerId = `${sourceId}-fill`
      map.on('click', fillLayerId, () => onSelectCampus(campus))
      map.on('mouseenter', fillLayerId, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', fillLayerId, () => {
        map.getCanvas().style.cursor = ''
      })

      // Real 3D buildings, restricted to just what's inside this campus's
      // boundary - every standard Mapbox style (this one included) ships a
      // `composite` source with a `building` source-layer carrying real OSM
      // footprints + height data. Starts unfiltered by location (just the
      // extrude check); updateOsmBuildingsFilter narrows it to campus-only
      // right after, and again on every move.
      const osmBuildingsLayerId = `${sourceId}-osm-3d`
      if (!map.getLayer(osmBuildingsLayerId)) {
        const firstSymbolLayer = map.getStyle().layers.find((l) => l.type === 'symbol')
        map.addLayer(
          {
            id: osmBuildingsLayerId,
            type: 'fill-extrusion',
            source: 'composite',
            'source-layer': 'building',
            minzoom: 15,
            filter: ['==', ['get', 'extrude'], 'true'],
            paint: {
              'fill-extrusion-color': '#cfc6a3',
              // OSM height/min_height often come through as strings, not
              // numbers, in this vector data - fill-extrusion-height/base
              // silently no-op on a non-number rather than erroring, which
              // was one of the earlier symptoms. to-number coerces either
              // case; the coalesce default only applies when actually missing.
              'fill-extrusion-height': ['to-number', ['coalesce', ['get', 'height'], 8]],
              'fill-extrusion-base': ['to-number', ['coalesce', ['get', 'min_height'], 0]],
              'fill-extrusion-opacity': 0.85,
            },
          },
          firstSymbolLayer?.id,
        )

        const refreshFilter = () => updateOsmBuildingsFilter(map, osmBuildingsLayerId, coords)
        // Tiles for the current view may not be loaded the instant the layer
        // is added - 'idle' fires once the map has finished rendering
        // everything it currently has queued, a safe first point to query.
        map.once('idle', refreshFilter)
        // Not `.once` - re-run on every subsequent pan/zoom too, since
        // different building tiles load in as the view changes.
        map.on('moveend', refreshFilter)
      }
    })

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
            allTightCoords.push(...insetRing(c, 0.35))
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
        const padLng = (realBounds.getEast() - realBounds.getWest()) * 0.3
        const padLat = (realBounds.getNorth() - realBounds.getSouth()) * 0.3
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

    // 3D building extrusions - one synthetic footprint per facility, colored
    // and sized from that facility's own color/height (falling back to its
    // type's color and a generic default height when not individually set).
    const buildingsSourceId = 'facility-buildings'
    const buildingsGeojson = {
      type: 'FeatureCollection',
      features: facilities.map((facility) => ({
        type: 'Feature',
        properties: {
          color:
            facility.color || FACILITY_TYPE_STYLES[facility.type]?.color || FACILITY_TYPE_STYLES.Office.color,
          height: facility.height ?? DEFAULT_BUILDING_HEIGHT,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [footprintPolygon(facility.latitude, facility.longitude, FOOTPRINT_SIZE_METERS)],
        },
      })),
    }

    if (map.getSource(buildingsSourceId)) {
      map.getSource(buildingsSourceId).setData(buildingsGeojson)
    } else {
      map.addSource(buildingsSourceId, { type: 'geojson', data: buildingsGeojson })
      map.addLayer({
        id: `${buildingsSourceId}-extrusion`,
        type: 'fill-extrusion',
        source: buildingsSourceId,
        paint: {
          // Data-driven styling - each feature's own color/height properties
          // (set above, per facility) drive the paint, not one fixed value.
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.9,
        },
      })
    }

    // Markers are cleared and rebuilt on every change rather than diffed -
    // simpler, and fine at this scale (a handful of buildings, not thousands).
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = facilities.map((facility) =>
      new mapboxgl.Marker({ element: buildMarkerElement(facility, onSelectFacility) })
        .setLngLat([facility.longitude, facility.latitude])
        .addTo(map),
    )

    return () => {
      if (introTimeoutId) window.clearTimeout(introTimeoutId)
    }
  }, [mapLoaded, campuses, facilities, onSelectFacility, onSelectCampus])

  // AdminPageShell renders this page fullBleed (no padding), so the only
  // thing left to subtract is Topbar's own height (h-16, lg:h-20) - this fills
  // every remaining pixel down to the viewport edge without overflowing it.
  return <div ref={containerRef} className="h-[calc(100vh-64px)] w-full overflow-hidden lg:h-[calc(100vh-80px)]" />
}

export default MapCanvas
