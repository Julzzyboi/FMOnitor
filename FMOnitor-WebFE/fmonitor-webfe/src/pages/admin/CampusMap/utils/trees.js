const METERS_PER_DEG_LAT = 111320
const DEFAULT_ROW_SPACING_M = 8
const DEFAULT_GROVE_DENSITY = 0.5
const GROVE_GRID_M = 5
const MAX_TREES = 6000

export function ringContains(ring, lng, lat) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

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

function metersPerDegLng(lat) {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)
}

function sizeOf(props) {
  const s = Number(props?.size)
  return Number.isFinite(s) && s > 0 ? s : 1
}

function treesAlongLine(coords, spacing, size, rand) {
  const out = []
  let nextAt = 0
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i]
    const [lng2, lat2] = coords[i + 1]
    const k = metersPerDegLng(lat1)
    const dx = (lng2 - lng1) * k
    const dy = (lat2 - lat1) * METERS_PER_DEG_LAT
    const len = Math.hypot(dx, dy)
    if (len === 0) continue
    let d = nextAt
    while (d <= len) {
      const f = d / len
      const jx = (rand() - 0.5) * 0.6
      const jy = (rand() - 0.5) * 0.6
      out.push({
        lng: lng1 + (dx * f + jx) / k,
        lat: lat1 + (dy * f + jy) / METERS_PER_DEG_LAT,
        size: size * (0.9 + rand() * 0.2),
      })
      d += spacing
    }
    nextAt = d - len
  }
  return out
}

function treesInPolygon(rings, density, size, rand) {
  const [outerRing, ...holes] = rings
  const lngs = outerRing.map((c) => c[0])
  const lats = outerRing.map((c) => c[1])
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const stepLng = GROVE_GRID_M / metersPerDegLng((minLat + maxLat) / 2)
  const stepLat = GROVE_GRID_M / METERS_PER_DEG_LAT
  const out = []
  for (let lat = minLat; lat <= maxLat; lat += stepLat) {
    for (let lng = minLng; lng <= maxLng; lng += stepLng) {
      const jx = rand()
      const jy = rand()
      const keep = rand() < density
      const s = 0.8 + rand() * 0.5
      if (!keep) continue
      const tLng = lng + (jx - 0.5) * stepLng
      const tLat = lat + (jy - 0.5) * stepLat
      if (ringContains(outerRing, tLng, tLat) && !holes.some((h) => ringContains(h, tLng, tLat))) {
        out.push({ lng: tLng, lat: tLat, size: size * s })
      }
    }
  }
  return out
}

export function generateTrees(featureCollection) {
  const trees = []
  const features = featureCollection?.features ?? []
  features.forEach((feature, index) => {
    const { geometry, properties } = feature ?? {}
    if (!geometry) return
    const size = sizeOf(properties)
    const rand = seededRandom(index + 1)
    if (geometry.type === 'Point') {
      const [lng, lat] = geometry.coordinates
      trees.push({ lng, lat, size, fixed: true })
    } else if (geometry.type === 'LineString') {
      const spacing = Math.max(1, Number(properties?.spacing) || DEFAULT_ROW_SPACING_M)
      trees.push(...treesAlongLine(geometry.coordinates, spacing, size, rand))
    } else if (geometry.type === 'Polygon') {
      const raw = Number(properties?.density)
      const density = Math.min(1, Math.max(0.05, raw > 0 ? raw : DEFAULT_GROVE_DENSITY))
      trees.push(...treesInPolygon(geometry.coordinates, density, size, rand))
    }
  })
  return trees.slice(0, MAX_TREES)
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

export function treesToGeoJSON(trees) {
  const features = []
  trees.forEach((t, i) => {
    const mPerDegLng = metersPerDegLng(t.lat)
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
