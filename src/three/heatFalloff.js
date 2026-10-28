// ILLUSTRATIVE surface-temperature falloff for the aircraft heat map.
// Only the nose value is physics-based (hot-wall radiative equilibrium at the
// stagnation point). Everywhere else the temperature is interpolated from
// the nose value with simple, made-up shape factors to show the pattern
// (hot nose and leading edges, cooler aft surfaces), NOT computed heating.
//
//   T = T∞ + (Tnose − T∞) × factor,   0 < factor ≤ 1

export const backgroundFactor = 0.3 // aft body and wing / fin surfaces

// Body: factor = 0.3 + 0.7 × exp(−s ÷ 0.05), s = distance from the nose tip ÷ length
export function bodyFactor(distanceFromNose, length) {
  return backgroundFactor + (1 - backgroundFactor) * Math.exp(-distanceFromNose / length / 0.05)
}

// Leading edge: factor = 0.3 + peak × exp(−d ÷ 0.015), d = chordwise distance
// behind the local leading edge ÷ aircraft length (peak 0.35 wing, 0.25 fin)
export function leadingEdgeFactor(distanceBehindEdge, length, peak) {
  return backgroundFactor + peak * Math.exp(-Math.max(0, distanceBehindEdge) / length / 0.015)
}

export function surfaceTemperature(noseTemperature, ambientTemperature, factor) {
  return ambientTemperature + (noseTemperature - ambientTemperature) * factor
}
