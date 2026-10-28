// Great-circle geometry on a spherical Earth.

export const meanEarthRadius = 6371000 // R, m

const degToRad = Math.PI / 180
const radToDeg = 180 / Math.PI

// Central angle by the haversine formula:
//   hav(θ) = sin²(Δφ ÷ 2) + cos φ1 × cos φ2 × sin²(Δλ ÷ 2), θ = 2 × asin(√hav)
export function centralAngle(startLat, startLon, endLat, endLon) {
  const phi1 = startLat * degToRad
  const phi2 = endLat * degToRad
  const dPhi = phi2 - phi1
  const dLambda = (endLon - startLon) * degToRad
  const hav =
    Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return 2 * Math.asin(Math.min(1, Math.sqrt(hav)))
}

// Surface distance: d = R × θ
export function greatCircleDistance(startLat, startLon, endLat, endLon) {
  return meanEarthRadius * centralAngle(startLat, startLon, endLat, endLon)
}

function toUnitVector(lat, lon) {
  const phi = lat * degToRad
  const lambda = lon * degToRad
  return [Math.cos(phi) * Math.cos(lambda), Math.cos(phi) * Math.sin(lambda), Math.sin(phi)]
}

// Point at a fraction f of the way along the great circle (spherical linear
// interpolation): p = [sin((1 − f) × θ) × a + sin(f × θ) × b] ÷ sin θ
export function intermediatePoint(startLat, startLon, endLat, endLon, fraction) {
  const theta = centralAngle(startLat, startLon, endLat, endLon)
  if (theta < 1e-12) return { latitude: startLat, longitude: startLon }
  const a = toUnitVector(startLat, startLon)
  const b = toUnitVector(endLat, endLon)
  const wa = Math.sin((1 - fraction) * theta) / Math.sin(theta)
  const wb = Math.sin(fraction * theta) / Math.sin(theta)
  const [x, y, z] = [0, 1, 2].map((k) => wa * a[k] + wb * b[k])
  return {
    latitude: Math.atan2(z, Math.hypot(x, y)) * radToDeg,
    longitude: Math.atan2(y, x) * radToDeg,
  }
}

// Ground-distance rate of an aircraft at altitude h: ds/dt = v × R ÷ (R + h)
export function groundSpeed(velocity, altitude) {
  return (velocity * meanEarthRadius) / (meanEarthRadius + altitude)
}
