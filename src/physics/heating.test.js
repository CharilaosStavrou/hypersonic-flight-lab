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
//   Tw (hot wall): solve 0.85σ (Tw⁴ − 226.509⁴) = 2.052e6 × (1 − Tw ÷ 4756.7)
//       at 2189.5 K: LHS = 4.8198e-8 × (2.2981e13 − 2.632e9) = 1.1075e6
//                    RHS = 2.052e6 × (1 − 0.46029)            = 1.1075e6  → Tw ≈ 2190 K
//       (the ambient term T∞⁴ changes Tw by only 0.002 % here)
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
  it('satisfies the energy balance ε σ (Tw⁴ − T∞⁴) = qs × (1 − Tw ÷ T0)', () => {
    const tw = hotWallTemperature(5e5, 0.8, 3000, 220)
    const lhs = 0.8 * stefanBoltzmann * (tw ** 4 - 220 ** 4)
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

  it('equals the ambient temperature at Mach 0 at every altitude', () => {
    for (const altitude of [0, 11000, 30000, 86000]) {
      const air = atmosphere(altitude)
      expect(hotWallTemperature(0, 0.85, air.temperature, air.temperature)).toBe(air.temperature)
    }
  })

  it('rises above ambient as soon as there is any heating (no floor)', () => {
    // Mach 0.3 at sea level: without the ambient term the balance gave ≈ 231 K
    const air = atmosphere(0)
    const v = trueAirspeed(0.3, air.speedOfSound)
    const qs = suttonGravesHeatFlux(air.density, v, 0.1)
    const tw = hotWallTemperature(qs, 0.85, stagnationTemperature(air.temperature, 0.3), air.temperature)
    expect(tw).toBeGreaterThan(air.temperature)
    expect(tw).toBeLessThan(stagnationTemperature(air.temperature, 0.3))
  })

  it('has no kink at low Mach: the slope dTw/dM changes smoothly', () => {
    // Slope between neighbouring 0.01-Mach steps, sea level, Mach 0–2.
    // The smooth curve changes slope by < 2 K per Mach per step; a floor at
    // T∞ (the earlier variant) jumps by ≈ 75 K per Mach where it engages.
    const air = atmosphere(0)
    const twAt = (mach, withFloor = false) => {
      const v = trueAirspeed(mach, air.speedOfSound)
      const qs = suttonGravesHeatFlux(air.density, v, 0.1)
      const t0 = stagnationTemperature(air.temperature, mach)
      if (!withFloor) return hotWallTemperature(qs, 0.85, t0, air.temperature)
      // Floored variant for comparison: ε σ Tw⁴ = qs (1 − Tw ÷ T0), then max(Tw, T∞)
      let low = 0
      let high = t0
      for (let i = 0; i < 100; i += 1) {
        const mid = (low + high) / 2
        if (0.85 * stefanBoltzmann * mid ** 4 - qs * (1 - mid / t0) > 0) high = mid
        else low = mid
      }
      return Math.max(low, air.temperature)
    }
    const maxSlopeJump = (withFloor) => {
      const step = 0.01
      let largest = 0
      let previousSlope = null
      for (let i = 0; i < 200; i += 1) {
        const slope = (twAt((i + 1) * step, withFloor) - twAt(i * step, withFloor)) / step
        if (previousSlope !== null) largest = Math.max(largest, Math.abs(slope - previousSlope))
        previousSlope = slope
      }
      return largest
    }
    expect(maxSlopeJump(false)).toBeLessThan(10)
    expect(maxSlopeJump(true)).toBeGreaterThan(50) // the test does detect a kink
  })

  it('rises monotonically with Mach', () => {
    const air = atmosphere(20000)
    let previous = -Infinity
    for (let mach = 0; mach <= 15; mach += 0.05) {
      const v = trueAirspeed(mach, air.speedOfSound)
      const qs = suttonGravesHeatFlux(air.density, v, 0.1)
      const tw = hotWallTemperature(qs, 0.85, stagnationTemperature(air.temperature, mach), air.temperature)
      expect(tw).toBeGreaterThanOrEqual(previous)
      previous = tw
    }
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
