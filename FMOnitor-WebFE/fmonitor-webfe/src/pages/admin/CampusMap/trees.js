// Auto-scattered decorative trees for the campus map. Purely visual - nothing
// is stored or editable. Positions are deterministic (seeded per campus), so
// the same trees appear in the same spots on every load and after every
// add/edit/delete; only the campus boundary and facility data feed into it.

const METERS_PER_DEG_LAT = 111320
const SPACING_M = 14 // grid step; each tree is jittered within its cell
const FIELD_CLEARANCE_M = 45 // Field with no drawn footprint: keep this radius clear
const AREA_CLEARANCE_M = 12 // any other facility pin: keep this radius clear
const MAX_TREES = 3000

// Ray-casting point-in-polygon against one ring ([lng,lat] pairs).
export function ringContains(ring, lng, lat) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// mulberry32 - tiny seeded PRNG so scatter is stable across loads.
function seededRandom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function parseRing(json) {
  try {
    const ring = JSON.parse(json)
    if (!Array.isArray(ring) || ring.length < 3) return null
    const [fl, fa] = ring[0]
    const [ll, la] = ring[ring.length - 1]
    return fl === ll && fa === la ? ring : [...ring, ring[0]]
  } catch {
    return null
  }
}

// One entry per facility that trees must stay away from.
function buildExclusions(facilities) {
  return facilities.map((f) => {
    const ring = f.footprintJson ? parseRing(f.footprintJson) : null
    const radius = f.type === 'Field' ? FIELD_CLEARANCE_M : AREA_CLEARANCE_M
    return { ring, lng: f.longitude, lat: f.latitude, radius }
  })
}

function isExcluded(exclusions, lng, lat, mPerDegLng) {
  for (const e of exclusions) {
    if (e.ring && ringContains(e.ring, lng, lat)) return true
    const dx = (lng - e.lng) * mPerDegLng
    const dy = (lat - e.lat) * METERS_PER_DEG_LAT
    if (dx * dx + dy * dy < e.radius * e.radius) return true
  }
  return false
}

// Returns [{ lng, lat, size }] - every point inside a campus boundary that is
// not inside/near a Field (or any other facility).
export function generateTrees(campuses, facilities) {
  const exclusions = buildExclusions(facilities)
  const trees = []
  for (const campus of campuses) {
    const ring = parseRing(campus.boundaryJson)
    if (!ring || ring.length < 4) continue
    const lngs = ring.map((c) => c[0])
    const lats = ring.map((c) => c[1])
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const midLat = (minLat + maxLat) / 2
    const mPerDegLng = METERS_PER_DEG_LAT * Math.cos((midLat * Math.PI) / 180)
    const stepLng = SPACING_M / mPerDegLng
    const stepLat = SPACING_M / METERS_PER_DEG_LAT
    const rand = seededRandom(Number(campus.id) || 1)

    for (let lat = minLat; lat <= maxLat; lat += stepLat) {
      for (let lng = minLng; lng <= maxLng; lng += stepLng) {
        // Always consume the same random numbers per cell, whether or not the
        // cell ends up used, so excluding one spot never reshuffles the rest.
        const jx = rand()
        const jy = rand()
        const keep = rand() < 0.7 // leave some gaps so it reads as natural, not a grid
        const size = 0.75 + rand() * 0.6
        const tLng = lng + (jx - 0.5) * stepLng * 0.9
        const tLat = lat + (jy - 0.5) * stepLat * 0.9
        if (!keep) continue
        if (!ringContains(ring, tLng, tLat)) continue
        if (isExcluded(exclusions, tLng, tLat, mPerDegLng)) continue
        trees.push({ lng: tLng, lat: tLat, size })
        if (trees.length >= MAX_TREES) return trees
      }
    }
  }
  return trees
}

function disc(lng, lat, radiusM, mPerDegLng, sides = 8) {
  const ring = []
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2
    ring.push([lng + (Math.cos(a) * radiusM) / mPerDegLng, lat + (Math.sin(a) * radiusM) / METERS_PER_DEG_LAT])
  }
  ring.push(ring[0])
  return ring
}

const TRUNK_COLOR = '#6b4423'
const CANOPY_COLORS = ['#2f7d32', '#3a8f3d', '#2a6f2e']

// Each tree = trunk + wide low canopy + narrow high canopy (a rounded cone).
export function treesToGeoJSON(trees) {
  const features = []
  trees.forEach((t, i) => {
    const mPerDegLng = METERS_PER_DEG_LAT * Math.cos((t.lat * Math.PI) / 180)
    const s = t.size
    const green = CANOPY_COLORS[i % CANOPY_COLORS.length]
    const part = (radius, base, height, color) => ({
      type: 'Feature',
      properties: { color, base, height },
      geometry: { type: 'Polygon', coordinates: [disc(t.lng, t.lat, radius, mPerDegLng)] },
    })
    features.push(part(0.35 * s, 0, 2.2 * s, TRUNK_COLOR))
    features.push(part(2.2 * s, 2.2 * s, 5.2 * s, green))
    features.push(part(1.3 * s, 5.2 * s, 7.6 * s, green))
  })
  return { type: 'FeatureCollection', features }
}
