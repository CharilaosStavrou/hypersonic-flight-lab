import { maxAltitude, minAltitude } from './atmosphere.js'
import { centralAngle } from './geodesy.js'
import { engineOrder } from './engine.js'
import { findMaterial } from './materials.js'

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)

function validateRoute(route, errors) {
  const { startLat, startLon, endLat, endLon } = route ?? {}
  for (const [name, value, limit] of [
    ['Start latitude', startLat, 90],
    ['End latitude', endLat, 90],
    ['Start longitude', startLon, 180],
    ['End longitude', endLon, 180],
  ]) {
    if (!isNumber(value) || Math.abs(value) > limit) {
      errors.push(`${name} must be a number between −${limit} and ${limit}°`)
    }
  }
  if (errors.length === 0 && Math.PI - centralAngle(startLat, startLon, endLat, endLon) < 1e-6) {
    errors.push('Start and end are antipodal: the great circle between them is not unique')
  }
}

function validateProfile(profile, errors) {
  if (!Array.isArray(profile) || profile.length < 2) {
    errors.push('The flight profile needs at least two keyframes')
    return
  }
  profile.forEach((keyframe, i) => {
    const label = `Keyframe ${i + 1}`
    if (!isNumber(keyframe.time) || keyframe.time < 0) errors.push(`${label}: time must be ≥ 0 s`)
    if (!isNumber(keyframe.altitude) || keyframe.altitude < minAltitude || keyframe.altitude > maxAltitude) {
      errors.push(`${label}: altitude must be between 0 and 86 km (atmosphere model range)`)
    }
    if (!isNumber(keyframe.mach) || keyframe.mach < 0) errors.push(`${label}: Mach must be ≥ 0`)
    if (i > 0 && isNumber(keyframe.time) && !(keyframe.time > profile[i - 1].time)) {
      errors.push(`${label}: time must be later than keyframe ${i}`)
    }
  })
}

function validateVehicle(vehicle, materials, errors) {
  const { length, wingspan, noseRadius, emissivity, materialId } = vehicle ?? {}
  if (!isNumber(length) || length <= 0) errors.push('Length must be > 0 m')
  if (!isNumber(wingspan) || wingspan <= 0) errors.push('Wingspan must be > 0 m')
  if (!isNumber(noseRadius) || noseRadius <= 0) errors.push('Nose radius must be > 0 m')
  if (!isNumber(emissivity) || emissivity <= 0 || emissivity > 1) {
    errors.push('Emissivity must be greater than 0 and at most 1')
  }
  if (Array.isArray(materials) && !findMaterial(materials, materialId)) {
    errors.push('The selected material is not in the materials list')
  }
}

function validateMaterials(materials, errors) {
  if (!Array.isArray(materials) || materials.length === 0) {
    errors.push('The materials list must contain at least one material')
    return
  }
  materials.forEach((material, i) => {
    if (typeof material.name !== 'string' || material.name.trim() === '') {
      errors.push(`Material ${i + 1}: name is required`)
    }
    if (!isNumber(material.maxServiceTemperature) || material.maxServiceTemperature <= 0) {
      errors.push(`Material ${i + 1}: maximum service temperature must be > 0 K`)
    }
  })
}

function validateEngineRanges(engineRanges, errors) {
  for (const name of engineOrder) {
    const range = engineRanges?.[name]
    if (!range || !isNumber(range.min) || !isNumber(range.max) || range.min < 0 || range.min >= range.max) {
      errors.push(`${name} range: need 0 ≤ min < max`)
    }
  }
}

// Returns a list of human-readable problems; empty means the model is valid.
export function validateModel(model) {
  const errors = []
  if (!model || typeof model !== 'object') return ['The model is missing']
  validateRoute(model.route, errors)
  validateProfile(model.profile, errors)
  validateMaterials(model.materials, errors)
  validateVehicle(model.vehicle, model.materials, errors)
  validateEngineRanges(model.engineRanges, errors)
  const maxQ = model.limits?.maxDynamicPressure
  if (!isNumber(maxQ) || maxQ <= 0) errors.push('Maximum dynamic pressure must be > 0 Pa')
  return errors
}
