export const FACILITY_GEOFENCE_MARGIN_M = 10

const METERS_PER_DEG_LAT = 111320

export function facilityOutline(facility) {
  let ring
  try {
    ring = JSON.parse(facility?.footprintJson)
  } catch {
    return null
  }
  if (!Array.isArray(ring) || ring.length < 3) return null
  const [first, last] = [ring[0], ring[ring.length - 1]]
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first]
}

function gridFrame(origin, angle) {
  const [lng0, lat0] = origin
  const kx = METERS_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    toGrid([lng, lat]) {
      const x = (lng - lng0) * kx
      const y = (lat - lat0) * METERS_PER_DEG_LAT
      return [x * cos + y * sin, -x * sin + y * cos]
    },
    fromGrid([u, v]) {
      const x = u * cos - v * sin
      const y = u * sin + v * cos
      return [lng0 + x / kx, lat0 + y / METERS_PER_DEG_LAT]
    },
  }
}

function boundsOf(points) {
  const us = points.map((p) => p[0])
  const vs = points.map((p) => p[1])
  return { minU: Math.min(...us), maxU: Math.max(...us), minV: Math.min(...vs), maxV: Math.max(...vs) }
}

export function campusGridAngle(boundaryRing) {
  const points = (boundaryRing ?? []).slice(0, -1)
  if (points.length < 3) return 0
  const straight = gridFrame(points[0], 0)
  const flat = points.map((p) => straight.toGrid(p))
  let best = { angle: 0, area: Infinity }
  for (let i = 0; i < flat.length; i++) {
    const [x1, y1] = flat[i]
    const [x2, y2] = flat[(i + 1) % flat.length]
    if (x1 === x2 && y1 === y2) continue
    const angle = ((Math.atan2(y2 - y1, x2 - x1) % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const b = boundsOf(flat.map(([x, y]) => [x * cos + y * sin, -x * sin + y * cos]))
    const area = (b.maxU - b.minU) * (b.maxV - b.minV)
    if (area < best.area) best = { angle, area }
  }
  return best.angle
}

function facilityGeofenceBox(facility, angle) {
  const ring = facilityOutline(facility)
  if (!ring) return null
  const frame = gridFrame(ring[0], angle)
  const b = boundsOf(ring.slice(0, -1).map((p) => frame.toGrid(p)))
  const m = FACILITY_GEOFENCE_MARGIN_M
  return { frame, bounds: { minU: b.minU - m, maxU: b.maxU + m, minV: b.minV - m, maxV: b.maxV + m } }
}

function boxRing(frame, { minU, maxU, minV, maxV }) {
  const corners = [
    [minU, minV],
    [maxU, minV],
    [maxU, maxV],
    [minU, maxV],
  ].map((c) => frame.fromGrid(c))
  return [...corners, corners[0]]
}

export function facilityGeofenceRing(facility, angle) {
  const box = facilityGeofenceBox(facility, angle)
  return box ? boxRing(box.frame, box.bounds) : null
}

export function isWithinFacilityGeofence(facility, lng, lat, angle) {
  const box = facilityGeofenceBox(facility, angle)
  if (!box) return false
  const [u, v] = box.frame.toGrid([lng, lat])
  const { minU, maxU, minV, maxV } = box.bounds
  return u >= minU && u <= maxU && v >= minV && v <= maxV
}
