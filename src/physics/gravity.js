import { g0 } from './atmosphere.js'
import { meanEarthRadius } from './geodesy.js'

// Effective gravity: g(h) = g0 × (R ÷ (R + h))²
export function effectiveGravity(altitude) {
  const ratio = meanEarthRadius / (meanEarthRadius + altitude)
  return g0 * ratio * ratio
}

// Centrifugal relief of level flight over a non-rotating spherical Earth:
// a_c = v² ÷ (R + h)
export function centrifugalRelief(velocity, altitude) {
  return (velocity * velocity) / (meanEarthRadius + altitude)
}

// Share of the weight the wings must still carry:
// W_eff ÷ W = (g(h) − v² ÷ (R + h)) ÷ g(h) × 100 %
export function effectiveWeightPercent(velocity, altitude) {
  const g = effectiveGravity(altitude)
  return ((g - centrifugalRelief(velocity, altitude)) / g) * 100
}
