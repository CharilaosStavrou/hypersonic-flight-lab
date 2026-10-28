import { describe, expect, it } from 'vitest'
import { project, unwrapRing } from './mapProjection.js'
import { flightPathPoints, latLonToVector, sceneRadius, thin } from './geo3d.js'

describe('equirectangular projection', () => {
  it('maps corners and the centre', () => {
    expect(project([-180, 90], 360, 180)).toEqual([0, 0])
    expect(project([0, 0], 360, 180)).toEqual([180, 90])
    expect(project([180, -90], 360, 180)).toEqual([360, 180])
  })
})

describe('unwrapRing', () => {
  it('leaves a ring that does not cross the antimeridian unchanged', () => {
    const ring = [[10, 10], [20, 10], [20, 20], [10, 10]]
    expect(unwrapRing(ring)).toEqual(ring)
  })

  it('makes a ring crossing the antimeridian continuous', () => {
    const ring = [[170, 0], [-170, 0], [-170, 10], [170, 10], [170, 0]]
    expect(unwrapRing(ring)).toEqual([[170, 0], [190, 0], [190, 10], [170, 10], [170, 0]])
  })

  it('closes a ring that winds around the south pole through the pole', () => {
    const ring = [[-180, -70], [-90, -72], [0, -70], [90, -68], [180, -70]]
    const out = unwrapRing(ring)
    expect(out.slice(-2)).toEqual([[180, -90], [-180, -90]])
  })

  it('handles an empty ring', () => {
    expect(unwrapRing([])).toEqual([])
  })
})

describe('scene coordinates', () => {
  it('places reference points on the unit sphere matching the texture mapping', () => {
    const close = (a, b) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 12))
    close(latLonToVector(0, 0), [1, 0, 0])
    close(latLonToVector(0, -90), [0, 0, 1])
    close(latLonToVector(0, 180), [-1, 0, 0])
    close(latLonToVector(90, 0), [0, 1, 0])
  })

  it('exaggerates altitude visually', () => {
    // 30 km × 50 ÷ 6371 km = 0.235442
    expect(sceneRadius(30000, 50)).toBeCloseTo(1.235442, 6)
    expect(sceneRadius(30000, 1)).toBeCloseTo(1.004709, 6)
    expect(Math.hypot(...latLonToVector(12, 34, 1.5))).toBeCloseTo(1.5, 12)
  })

  it('thins samples evenly and keeps the last one', () => {
    const samples = Array.from({ length: 1001 }, (_, i) => i)
    const thinned = thin(samples, 11)
    expect(thinned).toEqual([0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000])
    expect(thin([1, 2, 3], 10)).toEqual([1, 2, 3])
  })

  it('builds flight-path points with temperatures', () => {
    const samples = [
      { latitude: 0, longitude: 0, altitude: 0, wallTemperature: 300 },
      { latitude: 0, longitude: 90, altitude: 6371, wallTemperature: 900 },
    ]
    const points = flightPathPoints(samples, 100)
    expect(points[0]).toEqual({ position: [1, 0, -0], temperature: 300 })
    expect(Math.hypot(...points[1].position)).toBeCloseTo(1.1, 12)
  })
})
