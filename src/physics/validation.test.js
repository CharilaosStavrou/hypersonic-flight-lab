import { describe, expect, it } from 'vitest'
import { validateModel } from './validation.js'
import { createDefaultModel } from '../data/defaults.js'

function withChange(change) {
  const model = createDefaultModel()
  change(model)
  return validateModel(model)
}

describe('validateModel', () => {
  it('accepts the default model', () => {
    expect(validateModel(createDefaultModel())).toEqual([])
  })

  it('rejects a missing model', () => {
    expect(validateModel(null)).toEqual(['The model is missing'])
  })

  it.each([
    ['latitude out of range', (m) => (m.route.startLat = 91), /Start latitude/],
    ['antipodal route', (m) => (m.route = { startLat: 10, startLon: 20, endLat: -10, endLon: -160 }), /antipodal/],
    ['identical start and end', (m) => (m.route = { startLat: 10, startLon: 20, endLat: 10, endLon: 20 }), /must be different/],
    ['one keyframe', (m) => (m.profile = [m.profile[0]]), /at least two keyframes/],
    ['altitude above 86 km', (m) => (m.profile[1].altitude = 90000), /0 and 86 km/],
    ['negative Mach', (m) => (m.profile[1].mach = -1), /Mach must be ≥ 0/],
    ['non-increasing time', (m) => (m.profile[2].time = m.profile[1].time), /later than keyframe 2/],
    ['zero nose radius', (m) => (m.vehicle.noseRadius = 0), /Nose radius/],
    ['emissivity above 1', (m) => (m.vehicle.emissivity = 1.2), /Emissivity/],
    ['unknown material', (m) => (m.vehicle.materialId = 'x'), /not in the materials list/],
    ['empty materials', (m) => (m.materials = []), /at least one material/],
    ['empty material name', (m) => (m.materials[0].name = ' '), /name is required/],
    ['bad material limit', (m) => (m.materials[0].maxServiceTemperature = -5), /Material 1/],
    ['inverted engine range', (m) => (m.engineRanges.ramjet = { min: 6, max: 3 }), /ramjet range/],
    ['zero q limit', (m) => (m.limits.maxDynamicPressure = 0), /dynamic pressure/],
    ['length not a number', (m) => (m.vehicle.length = '30'), /Length/],
  ])('rejects %s', (_, change, message) => {
    const errors = withChange(change)
    expect(errors.some((e) => message.test(e)), errors.join('; ')).toBe(true)
  })
})
