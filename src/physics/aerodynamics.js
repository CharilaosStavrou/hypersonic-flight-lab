import { gamma } from './atmosphere.js'

// True airspeed: v = M × a
export function trueAirspeed(mach, speedOfSound) {
  return mach * speedOfSound
}

// Dynamic pressure: q = ½ × ρ × v²
export function dynamicPressure(density, velocity) {
  return 0.5 * density * velocity * velocity
}

// Ideal-gas stagnation temperature: T0 = T × (1 + (γ − 1) ÷ 2 × M²).
// Ideal-gas UPPER BOUND: at high Mach, real-gas effects (vibrational
// excitation, dissociation, γ falling below 1.4) make the real value lower.
export function stagnationTemperature(temperature, mach) {
  return temperature * (1 + ((gamma - 1) / 2) * mach * mach)
}
