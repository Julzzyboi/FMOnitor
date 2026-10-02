// Geofences are rectangles lined up with the campus grid.
//
// A facility's geofence is the smallest rectangle around its outline
// (footprintJson), turned to the campus grid, then grown by the margin on
// every side - so it's always a clean rectangle, never following every nook
// of a building, and a gate's small square doesn't sit like a diamond against
// the campus's diagonal streets. The campus grid's direction is read from the
// campus boundary itself (see campusGridAngle).
//
// The backend (GeofenceService) runs the exact same math - keep the two in
// step, including FACILITY_GEOFENCE_MARGIN_M = FACILITY_MARGIN_METERS.
export const FACILITY_GEOFENCE_MARGIN_M = 10

const METERS_PER_DEG_LAT = 111320

// The facility's outline as a closed [[lng, lat], ...] ring, or null.
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

// Flat local projection in meters around `origin` ([lng, lat]), turned by
// `angle` radians - `u`/`v` run along the campus grid. Accurate to well under
// a meter at campus scale.
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

// Direction of the campus grid, in radians within [0, pi/2): the turn of the
// smallest rectangle that fits around the campus boundary. For UST that's
// the angle of its diagonal streets. 0 (north-up) when there's no boundary.
export function campusGridAngle(boundaryRing) {
  const points = (boundaryRing ?? []).slice(0, -1)
  if (points.length < 3) return 0
  const straight = gridFrame(points[0], 0)
  const flat = points.map((p) => straight.toGrid(p))
  let best = { angle: 0, area: Infinity }
  // The best fit always lies along one of the outline's own edges.
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

// The facility's geofence rectangle as { frame, bounds }, or null.
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

// The facility's geofence as a closed [[lng, lat], ...] ring, for drawing.
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
