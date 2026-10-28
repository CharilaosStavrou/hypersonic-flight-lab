import { atmosphere } from './atmosphere.js'
import { dynamicPressure, stagnationTemperature, trueAirspeed } from './aerodynamics.js'
import { coldWallTemperature, hotWallTemperature, suttonGravesHeatFlux } from './heating.js'
import { engineMode } from './engine.js'
import { centrifugalRelief, effectiveGravity, effectiveWeightPercent } from './gravity.js'
import { greatCircleDistance, groundSpeed, intermediatePoint } from './geodesy.js'
import { exceedsMaterialLimit, findMaterial } from './materials.js'
import { interpolateProfile } from './profile.js'
import { validateModel } from './validation.js'

export const sampleInterval = 1 // s

// Sample times from the first to the last keyframe, every second, always
// including the final keyframe time.
function sampleTimes(profile) {
  const start = profile[0].time
  const end = profile[profile.length - 1].time
  const times = []
  for (let t = start; t < end; t += sampleInterval) times.push(t)
  times.push(end)
  return times
}

// Flight state at one instant, excluding ground position.
export function flightState(model, time) {
  const { altitude, mach } = interpolateProfile(model.profile, time)
  const air = atmosphere(altitude)
  const velocity = trueAirspeed(mach, air.speedOfSound)
  const heatFlux = suttonGravesHeatFlux(air.density, velocity, model.vehicle.noseRadius)
  const t0 = stagnationTemperature(air.temperature, mach)
  const engine = engineMode(mach, model.engineRanges)
  return {
    time,
    altitude,
    mach,
    temperature: air.temperature,
    pressure: air.pressure,
    density: air.density,
    speedOfSound: air.speedOfSound,
    velocity,
    dynamicPressure: dynamicPressure(air.density, velocity),
    stagnationTemperature: t0,
    heatFlux,
    coldWallTemperature: coldWallTemperature(heatFlux, model.vehicle.emissivity),
    wallTemperature: hotWallTemperature(heatFlux, model.vehicle.emissivity, t0, air.temperature),
    engineMode: engine.mode,
    engineOverlap: engine.overlap,
    gravity: effectiveGravity(altitude),
    centrifugalRelief: centrifugalRelief(velocity, altitude),
    effectiveWeightPercent: effectiveWeightPercent(velocity, altitude),
  }
}

const peakKeys = [
  'altitude',
  'mach',
  'velocity',
  'dynamicPressure',
  'stagnationTemperature',
  'heatFlux',
  'coldWallTemperature',
  'wallTemperature',
]

function findPeaks(samples) {
  const peaks = {}
  for (const key of peakKeys) {
    peaks[key] = samples.reduce(
      (best, s) => (s[key] > best.value ? { value: s[key], time: s.time } : best),
      { value: -Infinity, time: null },
    )
  }
  return peaks
}

function firstExceedance(samples, isExceeded, valueKey) {
  const sample = samples.find(isExceeded)
  return sample ? { time: sample.time, value: sample[valueKey] } : null
}

function engineNotes(samples, engineRanges) {
  const notes = []
  const seen = new Set()
  for (const s of samples) {
    if (s.engineOverlap && !seen.has(s.engineMode)) {
      seen.add(s.engineMode)
      const range = engineRanges[s.engineMode]
      notes.push(
        `Engine ranges overlap near Mach ${s.mach.toFixed(2)} (t = ${s.time} s): the higher-speed engine, ${s.engineMode} (Mach ${range.min}–${range.max}), is used`,
      )
    }
  }
  const outside = samples.find((s) => s.engineMode === 'none')
  if (outside) {
    notes.push(`Mach ${outside.mach.toFixed(2)} at t = ${outside.time} s is outside every engine range`)
  }
  return notes
}

// Runs the whole flight. Throws an Error listing all problems if the model is invalid.
export function simulateFlight(model) {
  const errors = validateModel(model)
  if (errors.length > 0) throw new Error(`Invalid model:\n${errors.join('\n')}`)

  const { startLat, startLon, endLat, endLon } = model.route
  const routeDistance = greatCircleDistance(startLat, startLon, endLat, endLon)
  const material = findMaterial(model.materials, model.vehicle.materialId)
  const notes = []

  // Ground distance: s = ∫ v × R ÷ (R + h) dt, trapezoidal rule at 1 s steps.
  // The flight ends on arrival: the crossing time inside the last step is found
  // by linear interpolation of s, and the rest of the profile is not flown.
  const times = sampleTimes(model.profile)
  const samples = []
  let distanceFlown = 0
  let previous = null
  let arrivalTime = null
  for (const time of times) {
    let state = flightState(model, time)
    let rate = groundSpeed(state.velocity, state.altitude)
    if (previous) {
      const step = 0.5 * (previous.rate + rate) * (time - previous.time)
      if (distanceFlown + step >= routeDistance) {
        const fraction = (routeDistance - distanceFlown) / step
        arrivalTime = previous.time + fraction * (time - previous.time)
        state = flightState(model, arrivalTime)
        distanceFlown = routeDistance
        samples.push({ ...state, groundDistance: routeDistance, latitude: endLat, longitude: endLon })
        break
      }
      distanceFlown += step
    }
    previous = { time, rate }
    const fraction = distanceFlown / routeDistance
    const position = intermediatePoint(startLat, startLon, endLat, endLon, fraction)
    samples.push({ ...state, groundDistance: distanceFlown, ...position })
  }

  const profileEnd = times[times.length - 1]
  if (arrivalTime !== null && arrivalTime < profileEnd) {
    notes.push(
      `Arrived at the end point (${(routeDistance / 1000).toFixed(0)} km) at t = ${arrivalTime.toFixed(1)} s: the simulation ends there and the remaining profile (t = ${arrivalTime.toFixed(1)}–${profileEnd} s) was not flown`,
    )
  }
  notes.push(...engineNotes(samples, model.engineRanges))

  const maxQ = model.limits.maxDynamicPressure
  const exceedances = {
    dynamicPressure: firstExceedance(samples, (s) => s.dynamicPressure > maxQ, 'dynamicPressure'),
    wallTemperature: firstExceedance(
      samples,
      (s) => exceedsMaterialLimit(s.wallTemperature, material),
      'wallTemperature',
    ),
  }
  const exceeded = [
    exceedances.wallTemperature && { kind: 'wallTemperature', ...exceedances.wallTemperature },
    exceedances.dynamicPressure && { kind: 'dynamicPressure', ...exceedances.dynamicPressure },
  ]
    .filter(Boolean)
    .sort((a, b) => a.time - b.time)

  const last = samples[samples.length - 1]
  return {
    samples,
    groundTrack: samples.map(({ time, latitude, longitude, altitude }) => ({ time, latitude, longitude, altitude })),
    peaks: findPeaks(samples),
    exceedances,
    verdict: {
      survives: exceeded.length === 0,
      firstExceeded: exceeded[0] ?? null,
      materialName: material.name,
      materialLimit: material.maxServiceTemperature,
      maxDynamicPressure: maxQ,
    },
    flightTime: last.time - samples[0].time,
    distanceFlown,
    routeDistance,
    arrivalTime,
    notes,
  }
}
