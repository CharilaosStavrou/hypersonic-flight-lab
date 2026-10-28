import { defaultMaterials } from './materials.js'

export const defaultEngineRanges = {
  turbojet: { min: 0, max: 3 },
  ramjet: { min: 3, max: 6 },
  scramjet: { min: 5, max: 12 },
}

export const defaultLimits = {
  maxDynamicPressure: 95000, // Pa
}

export const defaultVehicle = {
  length: 30, // m
  wingspan: 18, // m
  noseRadius: 0.1, // m
  emissivity: 0.85,
  materialId: 'carbonCarbon',
}

export function createDefaultModel() {
  return {
    route: { startLat: 34.9, startLon: -117.9, endLat: 40.6, endLon: -111.9 },
    profile: [
      { time: 0, altitude: 0, mach: 0 },
      { time: 600, altitude: 30000, mach: 10 },
      { time: 900, altitude: 30000, mach: 10 },
    ],
    vehicle: { ...defaultVehicle },
    limits: { ...defaultLimits },
    engineRanges: structuredClone(defaultEngineRanges),
    materials: structuredClone(defaultMaterials),
  }
}
