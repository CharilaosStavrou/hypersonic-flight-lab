import { describe, expect, it } from 'vitest'
import { heatDomain, heatFraction, heatGradientCss, heatStops, temperatureToRgb } from './heatColor.js'

describe('heat colour scale', () => {
  it('maps the domain ends to the first and last stops', () => {
    expect(temperatureToRgb(heatDomain.min)).toEqual(heatStops[0].rgb)
    expect(temperatureToRgb(heatDomain.max)).toEqual(heatStops.at(-1).rgb)
  })

  it('clamps temperatures outside the domain', () => {
    expect(temperatureToRgb(0)).toEqual(heatStops[0].rgb)
    expect(temperatureToRgb(5000)).toEqual(heatStops.at(-1).rgb)
    expect(heatFraction(Number.NaN)).toBe(0)
  })

  it('hits each stop exactly at its position', () => {
    for (const stop of heatStops) {
      const temperature = heatDomain.min + stop.at * (heatDomain.max - heatDomain.min)
      temperatureToRgb(temperature).forEach((v, k) => expect(v).toBeCloseTo(stop.rgb[k], 9))
    }
  })

  it('interpolates linearly between stops', () => {
    // halfway between stops 0 (at 0) and 1 (at 0.2) → f = 0.1 → T = 200 + 0.1 × 2200 = 420 K
    const expected = heatStops[0].rgb.map((v, k) => (v + heatStops[1].rgb[k]) / 2)
    temperatureToRgb(420).forEach((v, k) => expect(v).toBeCloseTo(expected[k], 9))
  })

  it('gets brighter (higher luminance) as temperature rises', () => {
    const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b
    let previous = -1
    for (let t = heatDomain.min; t <= heatDomain.max; t += 50) {
      const l = luminance(temperatureToRgb(t))
      expect(l).toBeGreaterThanOrEqual(previous - 0.05)
      previous = l
    }
    expect(luminance(temperatureToRgb(heatDomain.max))).toBeGreaterThan(luminance(temperatureToRgb(heatDomain.min)) * 3)
  })

  it('builds a CSS gradient with every stop', () => {
    const css = heatGradientCss()
    expect(css.startsWith('linear-gradient(to right')).toBe(true)
    expect(css.match(/rgb\(/g)).toHaveLength(heatStops.length)
  })
})
