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
    route: { startLat: 51.5074, startLon: -0.1278, endLat: 40.7128, endLon: -74.006 }, // London → New York
    profile: [
      { time: 0, altitude: 0, mach: 0 },
      { time: 120, altitude: 10000, mach: 0.9 },
      { time: 300, altitude: 20000, mach: 3 },
      { time: 600, altitude: 30000, mach: 10 },
      { time: 900, altitude: 30000, mach: 10 },
    ],
    vehicle: { ...defaultVehicle },
    limits: { ...defaultLimits },
    engineRanges: structuredClone(defaultEngineRanges),
    materials: structuredClone(defaultMaterials),
  }
}
