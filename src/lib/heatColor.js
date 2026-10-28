// Cool-to-hot colour scale for nose / surface temperature, shared by the
// Earth flight path, the aircraft heat map and their legends.
// Fixed domain so colours compare across flights: 200 K (−73 °C) to 2400 K (≈ 2127 °C).
export const heatDomain = { min: 200, max: 2400 } // K

// Colour stops at positions 0–1 (deep blue → violet → magenta → orange → yellow → near-white).
export const heatStops = [
  { at: 0, rgb: [0.12, 0.22, 0.55] },
  { at: 0.2, rgb: [0.3, 0.3, 0.8] },
  { at: 0.4, rgb: [0.62, 0.25, 0.7] },
  { at: 0.6, rgb: [0.9, 0.3, 0.35] },
  { at: 0.8, rgb: [1, 0.65, 0.15] },
  { at: 1, rgb: [1, 0.97, 0.75] },
]

// Position on the scale, clamped to [0, 1]: f = (T − Tmin) ÷ (Tmax − Tmin)
export function heatFraction(temperature) {
  const f = (temperature - heatDomain.min) / (heatDomain.max - heatDomain.min)
  return Math.min(1, Math.max(0, Number.isFinite(f) ? f : 0))
}

// Linear interpolation between neighbouring stops; returns [r, g, b] in 0–1.
export function temperatureToRgb(temperature) {
  const f = heatFraction(temperature)
  let i = 1
  while (i < heatStops.length - 1 && heatStops[i].at < f) i += 1
  const a = heatStops[i - 1]
  const b = heatStops[i]
  const t = (f - a.at) / (b.at - a.at)
  return a.rgb.map((value, k) => value + (b.rgb[k] - value) * t)
}

// CSS linear-gradient for legends (left = cool).
export function heatGradientCss() {
  const stops = heatStops.map((s) => {
    const [r, g, b] = s.rgb.map((v) => Math.round(v * 255))
    return `rgb(${r}, ${g}, ${b}) ${s.at * 100}%`
  })
  return `linear-gradient(to right, ${stops.join(', ')})`
}

export const legendTicks = [heatDomain.min, 800, 1400, 2000, heatDomain.max] // K

// Scale ticks whose labels stay readable next to the limit marker: a tick
// within `minGap` (fraction of the bar width) of the limit is left out.
export function visibleLegendTicks(limitTemperature, minGap = 0.12) {
  if (limitTemperature === undefined || limitTemperature === null) return legendTicks
  const limitFraction = heatFraction(limitTemperature)
  return legendTicks.filter((t) => Math.abs(heatFraction(t) - limitFraction) >= minGap)
}
