import { findMaterial } from '../physics/materials.js'

export const maxScenarios = 4

// Compact snapshot of one result for side-by-side comparison.
export function createScenario(name, model, result) {
  const material = findMaterial(model.materials, model.vehicle.materialId)
  const peakWall = result.peaks.wallTemperature
  const atPeak = result.samples.find((s) => s.time === peakWall.time)
  return {
    id: `scenario${Date.now()}${Math.round(Math.random() * 1e6)}`,
    name: name.trim() || 'Scenario',
    materialName: material.name,
    materialLimit: material.maxServiceTemperature,
    noseRadius: model.vehicle.noseRadius,
    emissivity: model.vehicle.emissivity,
    peakMach: result.peaks.mach.value,
    altitudeAtPeakTemperature: atPeak.altitude,
    peakWallTemperature: peakWall.value,
    peakColdWallTemperature: result.peaks.coldWallTemperature.value,
    peakDynamicPressure: result.peaks.dynamicPressure.value,
    maxDynamicPressure: model.limits.maxDynamicPressure,
    survives: result.verdict.survives,
    firstExceeded: result.verdict.firstExceeded,
  }
}

const numberKeys = [
  'materialLimit',
  'noseRadius',
  'emissivity',
  'peakMach',
  'altitudeAtPeakTemperature',
  'peakWallTemperature',
  'peakColdWallTemperature',
  'peakDynamicPressure',
  'maxDynamicPressure',
]

// Structural check for scenarios read from storage or a file.
export function isValidScenario(s) {
  if (!s || typeof s !== 'object') return false
  if (typeof s.id !== 'string' || typeof s.name !== 'string' || typeof s.materialName !== 'string') return false
  if (!numberKeys.every((key) => Number.isFinite(s[key]))) return false
  if (typeof s.survives !== 'boolean') return false
  if (s.firstExceeded === null) return s.survives
  return (
    typeof s.firstExceeded === 'object' &&
    ['wallTemperature', 'dynamicPressure'].includes(s.firstExceeded.kind) &&
    Number.isFinite(s.firstExceeded.time) &&
    Number.isFinite(s.firstExceeded.value)
  )
}
