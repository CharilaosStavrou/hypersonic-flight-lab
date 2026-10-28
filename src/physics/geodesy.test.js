import { describe, expect, it } from 'vitest'
import { greatCircleDistance, groundSpeed, intermediatePoint, meanEarthRadius } from './geodesy.js'

const london = [51.5074, -0.1278]
const newYork = [40.7128, -74.006]
const paris = [48.8566, 2.3522]
const tokyo = [35.6762, 139.6503]

describe('great-circle distance', () => {
  // Reference: WGS84 ellipsoidal geodesic distance (Vincenty inverse formula).
  // The spherical model should agree within 0.5 %.
  it('London – New York ≈ 5585.2 km (WGS84) within 0.5 %', () => {
    const d = greatCircleDistance(...london, ...newYork)
    expect(Math.abs(d - 5585234) / 5585234).toBeLessThan(0.005)
  })

  it('Paris – Tokyo ≈ 9735.3 km (WGS84) within 0.5 %', () => {
    const d = greatCircleDistance(...paris, ...tokyo)
    expect(Math.abs(d - 9735309) / 9735309).toBeLessThan(0.005)
  })

  it('a quarter of the equator is π R ÷ 2', () => {
    expect(greatCircleDistance(0, 0, 0, 90)).toBeCloseTo((Math.PI * meanEarthRadius) / 2, 3)
  })

  it('is zero for identical points', () => {
    expect(greatCircleDistance(...london, ...london)).toBe(0)
  })
})

describe('intermediatePoint', () => {
  it('returns the end points at fractions 0 and 1', () => {
    const start = intermediatePoint(...london, ...newYork, 0)
    const end = intermediatePoint(...london, ...newYork, 1)
    expect(start.latitude).toBeCloseTo(london[0], 9)
    expect(start.longitude).toBeCloseTo(london[1], 9)
    expect(end.latitude).toBeCloseTo(newYork[0], 9)
    expect(end.longitude).toBeCloseTo(newYork[1], 9)
  })

  it('splits the distance in proportion to the fraction', () => {
    const total = greatCircleDistance(...london, ...newYork)
    const p = intermediatePoint(...london, ...newYork, 0.3)
    expect(greatCircleDistance(...london, p.latitude, p.longitude) / total).toBeCloseTo(0.3, 9)
    expect(greatCircleDistance(p.latitude, p.longitude, ...newYork) / total).toBeCloseTo(0.7, 9)
  })

  it('goes over the pole on a meridian route', () => {
    const p = intermediatePoint(80, 0, 80, 180, 0.5)
    expect(p.latitude).toBeCloseTo(90, 6)
  })
})

describe('groundSpeed', () => {
  it('scales airspeed by R ÷ (R + h)', () => {
    // 3000 × 6371000 ÷ 6401000 = 2985.94 m/s
    expect(groundSpeed(3000, 30000)).toBeCloseTo(2985.94, 2)
    expect(groundSpeed(3000, 0)).toBe(3000)
  })
})
