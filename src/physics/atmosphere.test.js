import { describe, expect, it } from 'vitest'
import {
  atmosphere,
  geometricToGeopotential,
  geopotentialToGeometric,
  layers,
  maxAltitude,
} from './atmosphere.js'

function expectWithin(actual, expected, relativeTolerance) {
  const relativeError = Math.abs(actual - expected) / Math.abs(expected)
  expect(relativeError, `${actual} vs ${expected}`).toBeLessThanOrEqual(relativeTolerance)
}

// U.S. Standard Atmosphere 1976 (NOAA/NASA/USAF, NASA-TM-X-74335),
// tabulated by GEOMETRIC altitude.
const tableValues = [
  { altitude: 0, temperature: 288.15, pressure: 101325, density: 1.225, speedOfSound: 340.29 },
  { altitude: 11000, temperature: 216.774, pressure: 22699.9, density: 0.36480, speedOfSound: 295.154 },
  { altitude: 20000, temperature: 216.65, pressure: 5529.3, density: 0.088910, speedOfSound: 295.069 },
  { altitude: 30000, temperature: 226.509, pressure: 1197.0, density: 0.018410, speedOfSound: 301.709 },
  { altitude: 47000, temperature: 269.684, pressure: 115.85, density: 1.4965e-3, speedOfSound: 329.21 },
  { altitude: 71000, temperature: 216.846, pressure: 4.4795, density: 7.1966e-5, speedOfSound: 295.20 },
]

describe('atmosphere – USSA 1976 table values (within 0.1 %)', () => {
  for (const row of tableValues) {
    it(`matches the table at ${row.altitude / 1000} km`, () => {
      const state = atmosphere(row.altitude)
      expectWithin(state.temperature, row.temperature, 0.001)
      expectWithin(state.pressure, row.pressure, 0.001)
      expectWithin(state.density, row.density, 0.001)
      expectWithin(state.speedOfSound, row.speedOfSound, 0.001)
    })
  }

  it('reproduces the standard layer base pressures', () => {
    const standardBasePressures = [101325, 22632.06, 5474.889, 868.0187, 110.9063, 66.93887, 3.95642]
    layers.forEach((layer, i) => expectWithin(layer.basePressure, standardBasePressures[i], 1e-4))
  })
})

describe('atmosphere – continuity at layer boundaries', () => {
  for (const layer of layers.slice(1)) {
    it(`is continuous at ${layer.baseHeight / 1000} km geopotential`, () => {
      const boundary = geopotentialToGeometric(layer.baseHeight)
      const below = atmosphere(boundary - 1e-6)
      const above = atmosphere(boundary + 1e-6)
      expectWithin(above.temperature, below.temperature, 1e-9)
      expectWithin(above.pressure, below.pressure, 1e-9)
      expectWithin(above.density, below.density, 1e-9)
      expectWithin(above.speedOfSound, below.speedOfSound, 1e-9)
    })
  }

  it('decreases pressure and density monotonically from 0 to 86 km', () => {
    let previous = atmosphere(0)
    for (let h = 500; h <= maxAltitude; h += 500) {
      const current = atmosphere(h)
      expect(current.pressure).toBeLessThan(previous.pressure)
      expect(current.density).toBeLessThan(previous.density)
      previous = current
    }
  })
})

describe('atmosphere – geopotential conversion and range', () => {
  it('converts 86 km geometric to 84.852 km geopotential', () => {
    expectWithin(geometricToGeopotential(86000), 84852.05, 1e-6)
  })

  it('round-trips geometric ↔ geopotential', () => {
    for (const z of [0, 1234, 30000, 86000]) {
      expect(geopotentialToGeometric(geometricToGeopotential(z))).toBeCloseTo(z, 6)
    }
  })

  it('accepts the 86 km upper limit', () => {
    expect(() => atmosphere(86000)).not.toThrow()
  })

  it('throws a RangeError above 86 km, below 0 m and for non-numbers (no clamping)', () => {
    expect(() => atmosphere(86001)).toThrow(RangeError)
    expect(() => atmosphere(-1)).toThrow(RangeError)
    expect(() => atmosphere(Number.NaN)).toThrow(RangeError)
  })
})
