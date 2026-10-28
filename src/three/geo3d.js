// Geographic → scene coordinates (no Three.js). Earth radius = 1 scene unit.
// Matches Three.js SphereGeometry UV mapping of an equirectangular texture:
//   x = r cos φ cos λ, y = r sin φ, z = −r cos φ sin λ
import { meanEarthRadius } from '../physics/geodesy.js'

const degToRad = Math.PI / 180

export function latLonToVector(lat, lon, radius = 1) {
  const phi = lat * degToRad
  const lambda = lon * degToRad
  return [radius * Math.cos(phi) * Math.cos(lambda), radius * Math.sin(phi), -radius * Math.cos(phi) * Math.sin(lambda)]
}

// Scene radius of a point at altitude h with visual exaggeration k:
// r = 1 + k × h ÷ R (visual only)
export function sceneRadius(altitude, exaggeration) {
  return 1 + (exaggeration * altitude) / meanEarthRadius
}

// Evenly thins a sample list to at most maxCount entries, always keeping the last.
export function thin(samples, maxCount) {
  if (samples.length <= maxCount) return samples
  const step = (samples.length - 1) / (maxCount - 1)
  return Array.from({ length: maxCount }, (_, i) => samples[Math.round(i * step)])
}

// Flight-path points in scene units with their nose temperatures.
export function flightPathPoints(samples, exaggeration, maxCount = 800) {
  return thin(samples, maxCount).map((s) => ({
    position: latLonToVector(s.latitude, s.longitude, sceneRadius(s.altitude, exaggeration)),
    temperature: s.wallTemperature,
  }))
}
