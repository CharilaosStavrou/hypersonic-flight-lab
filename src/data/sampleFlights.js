import { createDefaultModel } from './defaults.js'

// Mach 10 run, Minneapolis → New York (1636 km): climb, accelerate through
// turbojet, ramjet and scramjet ranges to Mach 10 at 30 km, hold for 60 s,
// then decelerate and descend; the flight ends on arrival during the approach.
const mach10Profile = [
  { time: 0, altitude: 0, mach: 0 },
  { time: 90, altitude: 6000, mach: 0.8 },
  { time: 240, altitude: 15000, mach: 2.5 },
  { time: 420, altitude: 22000, mach: 5 },
  { time: 600, altitude: 30000, mach: 10 },
  { time: 660, altitude: 30000, mach: 10 },
  { time: 900, altitude: 25000, mach: 4 },
  { time: 1100, altitude: 15000, mach: 1.5 },
  { time: 1300, altitude: 6000, mach: 0.7 },
  { time: 1548, altitude: 0, mach: 0.25 },
]
const minneapolisNewYork = { startLat: 44.9778, startLon: -93.265, endLat: 40.7128, endLon: -74.006 }

// Long-range cruise, Paris → Tokyo (9712 km) at Mach 7 and 32 km.
const cruiseProfile = [
  { time: 0, altitude: 0, mach: 0 },
  { time: 120, altitude: 8000, mach: 0.9 },
  { time: 300, altitude: 18000, mach: 3 },
  { time: 450, altitude: 25000, mach: 5.5 },
  { time: 600, altitude: 32000, mach: 7 },
  { time: 4673, altitude: 32000, mach: 7 },
  { time: 4923, altitude: 22000, mach: 3 },
  { time: 5123, altitude: 10000, mach: 0.9 },
  { time: 5323, altitude: 0, mach: 0.3 },
]
const parisTokyo = { startLat: 48.8566, startLon: 2.3522, endLat: 35.6762, endLon: 139.6503 }

function sample(route, profile, vehicle) {
  const model = createDefaultModel()
  return { ...model, route, profile: structuredClone(profile), vehicle: { ...model.vehicle, ...vehicle } }
}

// Sample flights. Each builds a complete, independent model.
export const sampleFlights = [
  {
    id: 'mach10Blunt',
    name: 'Mach 10 run – blunt nose (rn 0.5 m)',
    build: () => sample(minneapolisNewYork, mach10Profile, { noseRadius: 0.5, materialId: 'carbonCarbon' }),
  },
  {
    id: 'mach10Sharp',
    name: 'Mach 10 run – sharp nose (rn 0.1 m)',
    build: () => sample(minneapolisNewYork, mach10Profile, { noseRadius: 0.1, materialId: 'carbonCarbon' }),
  },
  {
    id: 'cruiseParisTokyo',
    name: 'Mach 7 cruise Paris → Tokyo',
    build: () => sample(parisTokyo, cruiseProfile, { noseRadius: 0.2, materialId: 'carbonCarbon' }),
  },
]
