// Conversions between SI (internal) and display units.
export const kelvinToCelsius = (kelvin) => kelvin - 273.15
export const celsiusToKelvin = (celsius) => celsius + 273.15
export const metresToKm = (metres) => metres / 1000
export const kmToMetres = (km) => km * 1000
export const pascalToKpa = (pascal) => pascal / 1000
export const kpaToPascal = (kpa) => kpa * 1000
export const wattsToMw = (watts) => watts / 1e6

// Display formatting with a fixed number of decimals and a unit.
export function formatValue(value, decimals, unit = '') {
  if (!Number.isFinite(value)) return '–'
  const text = value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return unit ? `${text} ${unit}` : text
}

// Flight time as "m:ss" (or "h:mm:ss").
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return '–'
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
