import { describe, expect, it } from 'vitest'
import { atmosphere } from './atmosphere.js'
import { dynamicPressure, stagnationTemperature, trueAirspeed } from './aerodynamics.js'
import { coldWallTemperature, hotWallTemperature, stefanBoltzmann, suttonGravesHeatFlux } from './heating.js'

function expectWithin(actual, expected, relativeTolerance) {
  expect(Math.abs(actual - expected) / expected, `${actual} vs ${expected}`).toBeLessThan(relativeTolerance)
}

// Hand check, Mach 10 at 30 km, rn = 0.1 m, ε = 0.85
// USSA 1976 at 30 km: T = 226.509 K, ρ = 0.018410 kg/m³, a = √(1.4 × 287.05287 × 226.509) = 301.709 m/s
//   v   = 10 × 301.709                               = 3017.09 m/s
//   q   = ½ × 0.018410 × 3017.09²                    = 0.5 × 0.018410 × 9.10283e6 = 83.79 kPa
//   T0  = 226.509 × (1 + 0.2 × 100) = 226.509 × 21   = 4756.7 K
//   qs  = 1.7415e-4 × √(0.018410 ÷ 0.1) × 3017.09³
//       = 1.7415e-4 × 0.42907 × 2.74640e10           = 2.052 MW/m²
//   Tw (cold wall) = (2.052e6 ÷ (0.85 × 5.670374e-8))^¼
//       = (4.2578e13)^¼                              = 2554 K
//   Tw (hot wall): solve 0.85σ Tw⁴ = 2.052e6 × (1 − Tw ÷ 4756.7)
//       at 2189.5 K: LHS = 4.8198e-8 × 2.2981e13 = 1.1076e6
//                    RHS = 2.052e6 × (1 − 0.46029) = 1.1076e6  → Tw ≈ 2190 K
describe('hand check at Mach 10, 30 km, rn = 0.1 m, ε = 0.85', () => {
  const air = atmosphere(30000)
  const v = trueAirspeed(10, air.speedOfSound)
  const qs = suttonGravesHeatFlux(air.density, v, 0.1)
  const t0 = stagnationTemperature(air.temperature, 10)

  it('true airspeed ≈ 3017 m/s', () => expectWithin(v, 3017.09, 1e-4))
  it('dynamic pressure ≈ 84 kPa', () => expectWithin(dynamicPressure(air.density, v), 83790, 1e-3))
  it('ideal-gas stagnation temperature ≈ 4760 K', () => expectWithin(t0, 4756.7, 1e-3))
  it('Sutton–Graves heat flux ≈ 2.05 MW/m²', () => expectWithin(qs, 2.052e6, 1e-3))
  it('cold-wall temperature ≈ 2554 K', () => expectWithin(coldWallTemperature(qs, 0.85), 2554, 1e-3))
  it('hot-wall temperature ≈ 2190 K', () => {
    expectWithin(hotWallTemperature(qs, 0.85, t0, air.temperature), 2189.5, 1e-3)
  })
})

describe('Sutton–Graves', () => {
  it('scales with v³ and 1 ÷ √rn', () => {
    const base = suttonGravesHeatFlux(0.01, 2000, 0.1)
    expect(suttonGravesHeatFlux(0.01, 4000, 0.1) / base).toBeCloseTo(8, 9)
    expect(suttonGravesHeatFlux(0.01, 2000, 0.4) / base).toBeCloseTo(0.5, 9)
  })
})

describe('hot-wall temperature', () => {
  it('satisfies the energy balance ε σ Tw⁴ = qs × (1 − Tw ÷ T0)', () => {
    const tw = hotWallTemperature(5e5, 0.8, 3000, 220)
    const lhs = 0.8 * stefanBoltzmann * tw ** 4
    const rhs = 5e5 * (1 - tw / 3000)
    expectWithin(lhs, rhs, 1e-8)
  })

  it('never exceeds T0 and never falls below ambient, at any Mach and altitude', () => {
    for (const altitude of [0, 11000, 20000, 30000, 47000, 71000, 86000]) {
      const air = atmosphere(altitude)
      for (let mach = 0; mach <= 25; mach += 0.25) {
        const v = trueAirspeed(mach, air.speedOfSound)
        const t0 = stagnationTemperature(air.temperature, mach)
        for (const noseRadius of [0.01, 0.1, 1]) {
          const qs = suttonGravesHeatFlux(air.density, v, noseRadius)
          const tw = hotWallTemperature(qs, 0.85, t0, air.temperature)
          expect(tw).toBeLessThanOrEqual(t0)
          expect(tw).toBeGreaterThanOrEqual(air.temperature)
        }
      }
    }
  })

  it('is below the cold-wall value whenever heating is significant', () => {
    const tw = hotWallTemperature(2e6, 0.85, 4757, 226.5)
    expect(tw).toBeLessThan(coldWallTemperature(2e6, 0.85))
  })

  it('returns the ambient temperature at Mach 0 and when the balance settles below ambient', () => {
    expect(hotWallTemperature(0, 0.85, 288.15, 288.15)).toBe(288.15)
    // Mach 0.3 at sea level: balance would give ≈ 231 K < 288.15 K ambient
    const air = atmosphere(0)
    const v = trueAirspeed(0.3, air.speedOfSound)
    const qs = suttonGravesHeatFlux(air.density, v, 0.1)
    expect(hotWallTemperature(qs, 0.85, stagnationTemperature(air.temperature, 0.3), air.temperature)).toBe(288.15)
  })

  it('stays below T0 where the cold-wall value would exceed it (Mach 0.8 at sea level)', () => {
    // cold wall ≈ 711 K, T0 = 288.15 × 1.128 = 325.0 K
    const air = atmosphere(0)
    const v = trueAirspeed(0.8, air.speedOfSound)
    const qs = suttonGravesHeatFlux(air.density, v, 0.1)
    const t0 = stagnationTemperature(air.temperature, 0.8)
    expect(coldWallTemperature(qs, 0.85)).toBeGreaterThan(700)
    const tw = hotWallTemperature(qs, 0.85, t0, air.temperature)
    expect(tw).toBeGreaterThan(air.temperature)
    expect(tw).toBeLessThan(t0)
  })
})
