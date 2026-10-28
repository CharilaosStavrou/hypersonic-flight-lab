import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { aircraftDimensions, bodyProfile, createAircraft, radiusAt } from './aircraftModel.js'
import { backgroundFactor, bodyFactor, leadingEdgeFactor, surfaceTemperature } from './heatFalloff.js'
import { createHumanFigure } from './scaleReference.js'

const vehicle = { length: 30, wingspan: 18, noseRadius: 0.1 }

function boxOf(object) {
  object.updateMatrixWorld(true)
  return new THREE.Box3().setFromObject(object)
}

function heatedBox(aircraft) {
  const box = new THREE.Box3()
  for (const mesh of aircraft.userData.heatParts) box.union(boxOf(mesh))
  return box
}

describe('aircraft geometry matches the vehicle inputs', () => {
  for (const v of [vehicle, { length: 45, wingspan: 12, noseRadius: 0.3 }, { length: 12, wingspan: 9, noseRadius: 0.02 }]) {
    it(`length ${v.length} m, wingspan ${v.wingspan} m, nose radius ${v.noseRadius} m`, () => {
      const aircraft = createAircraft(v)
      const box = heatedBox(aircraft)
      expect(box.max.x - box.min.x).toBeCloseTo(v.length, 6) // nose tip to tail
      expect(box.max.x).toBeCloseTo(v.length / 2, 6)
      expect(box.max.z - box.min.z).toBeCloseTo(v.wingspan, 6) // tip to tip
      // wheels stand on the ground
      expect(boxOf(aircraft).min.y).toBeCloseTo(0, 6)
    })
  }

  it('starts the body with a nose sphere of exactly the nose radius', () => {
    const d = aircraftDimensions(vehicle)
    const profile = bodyProfile(d)
    expect(profile[0]).toEqual([0, 0])
    // sphere centre at a = rn on the axis: every arc point is rn away from it
    for (const [r, a] of profile.slice(0, 17)) {
      expect(Math.hypot(r, a - vehicle.noseRadius)).toBeCloseTo(vehicle.noseRadius, 12)
    }
  })

  it('joins the nose sphere and the cone tangentially and reaches the body radius', () => {
    const d = aircraftDimensions(vehicle)
    const profile = bodyProfile(d)
    const theta = Math.atan((d.bodyRadius - d.noseRadius) / d.forebodyLength)
    const [rt, at] = profile[16]
    expect(rt).toBeCloseTo(d.noseRadius * Math.cos(theta), 12)
    expect(at).toBeCloseTo(d.noseRadius * (1 - Math.sin(theta)), 12)
    expect(profile[28][0]).toBeCloseTo(d.bodyRadius, 9)
    expect(radiusAt(profile, 0.6 * d.length)).toBeCloseTo(d.bodyRadius, 9)
    expect(profile.at(-1)).toEqual([0, d.length])
  })

  it('keeps the body wider than the nose sphere for blunt noses', () => {
    expect(aircraftDimensions({ ...vehicle, noseRadius: 2 }).bodyRadius).toBeCloseTo(2.6, 12)
    const box = heatedBox(createAircraft({ ...vehicle, noseRadius: 2 }))
    expect(box.max.x - box.min.x).toBeCloseTo(30, 6)
  })

  it('stores a heat factor for every vertex of every heated part', () => {
    for (const mesh of createAircraft(vehicle).userData.heatParts) {
      const factors = mesh.geometry.userData.heatFactors
      expect(factors).toHaveLength(mesh.geometry.attributes.position.count)
      for (const f of factors) {
        expect(f).toBeGreaterThanOrEqual(backgroundFactor - 1e-6)
        expect(f).toBeLessThanOrEqual(1 + 1e-6)
      }
    }
  })
})

describe('human figure for scale', () => {
  it('is exactly 1.8 m tall and stands on the ground', () => {
    const box = boxOf(createHumanFigure())
    expect(box.min.y).toBeCloseTo(0, 6)
    expect(box.max.y).toBeCloseTo(1.8, 6)
  })
})

describe('illustrative heat falloff', () => {
  it('equals the physics-based nose temperature at the nose tip', () => {
    expect(bodyFactor(0, 30)).toBe(1)
    expect(surfaceTemperature(2189.5, 226.5, bodyFactor(0, 30))).toBe(2189.5)
  })

  it('falls monotonically along the body towards the background value', () => {
    let previous = Infinity
    for (let a = 0; a <= 30; a += 0.5) {
      const f = bodyFactor(a, 30)
      expect(f).toBeLessThanOrEqual(previous)
      previous = f
    }
    expect(bodyFactor(30, 30)).toBeCloseTo(backgroundFactor, 6)
  })

  it('makes leading edges hotter than the surface behind them but cooler than the nose', () => {
    const edge = leadingEdgeFactor(0, 30, 0.35)
    expect(edge).toBeCloseTo(0.65, 12)
    expect(edge).toBeLessThan(1)
    expect(leadingEdgeFactor(3, 30, 0.35)).toBeLessThan(edge)
    expect(leadingEdgeFactor(-1, 30, 0.35)).toBe(edge) // clamp ahead of the edge
  })

  it('interpolates between ambient and nose temperature', () => {
    expect(surfaceTemperature(1000, 200, 0.3)).toBeCloseTo(440, 12)
    expect(surfaceTemperature(1000, 200, 0)).toBe(200)
  })
})
