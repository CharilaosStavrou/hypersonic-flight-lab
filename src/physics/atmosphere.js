// US Standard Atmosphere 1976, 0–86 km geometric altitude.
// Pure module: SI units in and out (m, K, Pa, kg/m³, m/s).
//
// Below 86 km the model uses the molecular-scale temperature TM, as the
// standard does for its hydrostatic equation. Between 80 and 86 km the
// standard's kinetic temperature differs from TM by at most 0.04 %
// (molecular-weight ratio M/M0 falls from 1 to 0.99961); that correction
// is not applied here.

export const gasConstant = 287.05287 // R, J/(kg·K)
export const gamma = 1.4 // ratio of specific heats, γ
export const g0 = 9.80665 // standard gravity, m/s²
export const earthRadiusGeopotential = 6356766 // r0 for geopotential conversion, m

export const minAltitude = 0 // m, geometric
export const maxAltitude = 86000 // m, geometric

// Layer bases in geopotential metres, base temperature (K), lapse rate (K/m).
const layerDefinitions = [
  { baseHeight: 0, baseTemperature: 288.15, lapseRate: -0.0065 },
  { baseHeight: 11000, baseTemperature: 216.65, lapseRate: 0 },
  { baseHeight: 20000, baseTemperature: 216.65, lapseRate: 0.001 },
  { baseHeight: 32000, baseTemperature: 228.65, lapseRate: 0.0028 },
  { baseHeight: 47000, baseTemperature: 270.65, lapseRate: 0 },
  { baseHeight: 51000, baseTemperature: 270.65, lapseRate: -0.0028 },
  { baseHeight: 71000, baseTemperature: 214.65, lapseRate: -0.002 },
]

const seaLevelPressure = 101325 // Pa

// Pressure in a layer from its base values (hydrostatic equation + ideal gas):
//   lapse ≠ 0: p = pb × (Tb ÷ T)^(g0 ÷ (R × L))
//   lapse = 0: p = pb × exp(−g0 × (H − Hb) ÷ (R × Tb))
function layerPressure(layer, geopotentialHeight) {
  const { baseHeight, baseTemperature, lapseRate, basePressure } = layer
  const dh = geopotentialHeight - baseHeight
  if (lapseRate === 0) {
    return basePressure * Math.exp((-g0 * dh) / (gasConstant * baseTemperature))
  }
  const temperature = baseTemperature + lapseRate * dh
  return basePressure * Math.pow(baseTemperature / temperature, g0 / (gasConstant * lapseRate))
}

// Base pressures are derived by chaining each layer from sea level, so the
// pressure is continuous at every boundary by construction.
export const layers = layerDefinitions.reduce((acc, definition, index) => {
  const basePressure =
    index === 0
      ? seaLevelPressure
      : layerPressure(acc[index - 1], definition.baseHeight)
  acc.push({ ...definition, basePressure })
  return acc
}, [])

// Geopotential height: H = r0 × z ÷ (r0 + z)
export function geometricToGeopotential(geometricAltitude) {
  return (earthRadiusGeopotential * geometricAltitude) / (earthRadiusGeopotential + geometricAltitude)
}

// Inverse: z = r0 × H ÷ (r0 − H)
export function geopotentialToGeometric(geopotentialHeight) {
  return (earthRadiusGeopotential * geopotentialHeight) / (earthRadiusGeopotential - geopotentialHeight)
}

function findLayer(geopotentialHeight) {
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    if (geopotentialHeight >= layers[i].baseHeight) return layers[i]
  }
  return layers[0]
}

export function isAltitudeInRange(geometricAltitude) {
  return (
    Number.isFinite(geometricAltitude) &&
    geometricAltitude >= minAltitude &&
    geometricAltitude <= maxAltitude
  )
}

// Atmospheric state at a geometric altitude (m).
// Outside 0–86 km this throws a RangeError instead of clamping, so a flight
// profile that leaves the model's validity range is reported, not hidden.
export function atmosphere(geometricAltitude) {
  if (!isAltitudeInRange(geometricAltitude)) {
    throw new RangeError(
      `Altitude ${geometricAltitude} m is outside the US Standard Atmosphere 1976 range (0–86 km) used by this model`,
    )
  }
  const geopotentialHeight = geometricToGeopotential(geometricAltitude)
  const layer = findLayer(geopotentialHeight)
  // T = Tb + L × (H − Hb)
  const temperature = layer.baseTemperature + layer.lapseRate * (geopotentialHeight - layer.baseHeight)
  const pressure = layerPressure(layer, geopotentialHeight)
  // ρ = p ÷ (R × T)
  const density = pressure / (gasConstant * temperature)
  // a = √(γ × R × T)
  const speedOfSound = Math.sqrt(gamma * gasConstant * temperature)
  return { temperature, pressure, density, speedOfSound, geopotentialHeight }
}
