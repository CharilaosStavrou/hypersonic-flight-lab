import { describe, expect, it } from 'vitest'
import { simulateFlight } from './simulation.js'
import { greatCircleDistance } from './geodesy.js'
import { createDefaultModel } from '../data/defaults.js'

// London → New York, 5570 km on the sphere
function model(overrides = {}) {
  return {
    ...createDefaultModel(),
    route: { startLat: 51.5074, startLon: -0.1278, endLat: 40.7128, endLon: -74.006 },
    profile: [
      { time: 0, altitude: 30000, mach: 10 },
      { time: 100, altitude: 30000, mach: 10 },
    ],
    ...overrides,
  }
}

describe('simulateFlight – sampling and integration', () => {
  it('samples every second from the first to the last keyframe', () => {
    const result = simulateFlight(model())
    expect(result.samples).toHaveLength(101)
    expect(result.samples[0].time).toBe(0)
    expect(result.samples[100].time).toBe(100)
    expect(result.flightTime).toBe(100)
  })

  it('includes a fractional final keyframe time', () => {
    const result = simulateFlight(model({ profile: [{ time: 0, altitude: 0, mach: 0.5 }, { time: 2.5, altitude: 0, mach: 0.5 }] }))
    expect(result.samples.map((s) => s.time)).toEqual([0, 1, 2, 2.5])
  })

  it('integrates ground distance = v × R ÷ (R + h) × t at constant speed', () => {
    // 3017.09 m/s × 6371 ÷ 6401 × 100 s = 300.29 km
    const result = simulateFlight(model())
    expect(result.distanceFlown).toBeCloseTo(300294, -1)
    const last = result.samples[100]
    const flown = greatCircleDistance(51.5074, -0.1278, last.latitude, last.longitude)
    expect(flown / result.distanceFlown).toBeCloseTo(1, 6)
    expect(result.arrivalTime).toBeNull()
  })

  it('ends the simulation on arrival when the route is shorter than the profile, and says so', () => {
    // London → Paris = 343.9 km on the sphere; at 3017.09 × 6371 ÷ 6401 = 3002.95 m/s
    // arrival is at 343.9 km ÷ 3002.95 m/s ≈ 114.5 s, before the 200 s profile ends
    const result = simulateFlight(
      model({
        route: { startLat: 51.5074, startLon: -0.1278, endLat: 48.8566, endLon: 2.3522 },
        profile: [{ time: 0, altitude: 30000, mach: 10 }, { time: 200, altitude: 30000, mach: 10 }],
      }),
    )
    const expectedArrival = result.routeDistance / 3002.95
    expect(result.arrivalTime).toBeCloseTo(expectedArrival, 1)
    expect(result.flightTime).toBeCloseTo(expectedArrival, 1)
    const last = result.samples.at(-1)
    expect(last.time).toBe(result.arrivalTime)
    expect(result.samples.at(-2).time).toBe(114)
    expect(last).toMatchObject({ latitude: 48.8566, longitude: 2.3522 })
    expect(last.groundDistance).toBe(result.routeDistance)
    expect(result.distanceFlown).toBe(result.routeDistance)
    expect(result.notes.some((n) => n.includes('remaining profile') && n.includes('was not flown'))).toBe(true)
  })
})

describe('simulateFlight – limits, peaks and verdict', () => {
  it('reproduces the Mach 10 / 30 km hand-checked values in every sample', () => {
    const s = simulateFlight(model()).samples[50]
    expect(s.dynamicPressure).toBeCloseTo(83792, -1)
    expect(s.stagnationTemperature).toBeCloseTo(4756.7, 0)
    expect(s.heatFlux / 2.052e6).toBeCloseTo(1, 3)
    expect(s.coldWallTemperature).toBeCloseTo(2554.4, 0)
    expect(s.wallTemperature).toBeCloseTo(2189.5, 0)
    expect(s.engineMode).toBe('scramjet')
    expect(s.effectiveWeightPercent).toBeCloseTo(85.36, 1)
  })

  it('fails carbon-carbon (1923 K) on the hot-wall temperature at Mach 10 / 30 km with rn = 0.1 m', () => {
    const result = simulateFlight(model())
    expect(result.verdict.survives).toBe(false)
    expect(result.verdict.firstExceeded).toMatchObject({ kind: 'wallTemperature', time: 0 })
    expect(result.exceedances.dynamicPressure).toBeNull() // 83.8 kPa < 95 kPa
  })

  it('reports the first exceedance time of a rising profile', () => {
    // Mach 0 → 10 over 1000 s at 30 km: q = 95 kPa is crossed at Mach ≈ 10.65 → never;
    // with a 50 kPa limit q crosses at M = √(50000 ÷ (½ × 0.01841 × 301.709²)) = 7.725 → t = 773 s
    const m = model({
      profile: [{ time: 0, altitude: 30000, mach: 0 }, { time: 1000, altitude: 30000, mach: 10 }],
      limits: { maxDynamicPressure: 50000 },
      vehicle: { ...createDefaultModel().vehicle, noseRadius: 5 },
    })
    const result = simulateFlight(m)
    expect(result.exceedances.dynamicPressure.time).toBe(773)
    expect(result.exceedances.wallTemperature).toBeNull()
    expect(result.verdict.firstExceeded.kind).toBe('dynamicPressure')
  })

  it('survives when no limit is exceeded and finds peak values with their times', () => {
    const result = simulateFlight(
      model({
        profile: [
          { time: 0, altitude: 0, mach: 0 },
          { time: 60, altitude: 20000, mach: 3 },
          { time: 120, altitude: 25000, mach: 2 },
        ],
      }),
    )
    expect(result.verdict.survives).toBe(true)
    expect(result.verdict.firstExceeded).toBeNull()
    expect(result.peaks.mach).toEqual({ value: 3, time: 60 })
    expect(result.peaks.altitude).toEqual({ value: 25000, time: 120 })
  })

  it('reports an engine overlap note and the ground track', () => {
    const result = simulateFlight(
      model({ profile: [{ time: 0, altitude: 25000, mach: 4 }, { time: 10, altitude: 25000, mach: 7 }] }),
    )
    expect(result.notes.some((n) => n.includes('overlap') && n.includes('scramjet'))).toBe(true)
    expect(result.groundTrack).toHaveLength(result.samples.length)
    expect(Object.keys(result.groundTrack[0]).sort()).toEqual(['altitude', 'latitude', 'longitude', 'time'])
  })
})

describe('simulateFlight – edge cases', () => {
  it('notes Mach outside every engine range', () => {
    const result = simulateFlight(model({ profile: [{ time: 0, altitude: 60000, mach: 12 }, { time: 5, altitude: 60000, mach: 14 }] }))
    expect(result.samples.at(-1).engineMode).toBe('none')
    expect(result.notes.some((n) => n.includes('outside every engine range'))).toBe(true)
  })
})

describe('simulateFlight – invalid input', () => {
  it('throws with all validation messages', () => {
    const bad = model({ profile: [{ time: 0, altitude: 90000, mach: 1 }] })
    expect(() => simulateFlight(bad)).toThrow(/at least two keyframes/)
  })
})
