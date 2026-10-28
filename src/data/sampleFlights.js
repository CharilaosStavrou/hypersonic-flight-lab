import { createDefaultModel } from './defaults.js'

// Sample flights. Each builds a complete model from the defaults.
export const sampleFlights = [
  {
    id: 'mach10Run',
    name: 'Mach 10 run',
    build: () => ({
      ...createDefaultModel(),
      route: { startLat: 34.9054, startLon: -117.8839, endLat: 39.7392, endLon: -104.9903 }, // Mojave → Denver
      profile: [
        { time: 0, altitude: 0, mach: 0 },
        { time: 90, altitude: 6000, mach: 0.8 },
        { time: 240, altitude: 15000, mach: 2.5 },
        { time: 420, altitude: 22000, mach: 5 },
        { time: 600, altitude: 30000, mach: 10 },
        { time: 660, altitude: 30000, mach: 10 },
        { time: 900, altitude: 25000, mach: 4 },
        { time: 1100, altitude: 15000, mach: 1.5 },
      ],
    }),
  },
]
