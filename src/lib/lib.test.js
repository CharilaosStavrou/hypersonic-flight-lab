import { describe, expect, it } from 'vitest'
import { formatDecimal, parseDecimal } from './parseDecimal.js'
import { categoryRuns, linearScale, niceTicks } from './chartScale.js'
import { celsiusToKelvin, formatDuration, formatValue, kelvinToCelsius } from './units.js'

describe('parseDecimal', () => {
  it('accepts points, commas, signs and exponents', () => {
    expect(parseDecimal('1,5')).toBe(1.5)
    expect(parseDecimal(' 2.75 ')).toBe(2.75)
    expect(parseDecimal('-0,1')).toBe(-0.1)
    expect(parseDecimal('1e-3')).toBe(0.001)
    expect(parseDecimal(',5')).toBe(0.5)
    expect(parseDecimal('12')).toBe(12)
  })

  it('rejects empty and malformed text', () => {
    for (const text of ['', ' ', 'abc', '1,2,3', '1.2.3', '1,5.2', '--1', '1e']) {
      expect(parseDecimal(text), text).toBeNaN()
    }
  })

  it('formats without trailing zeros', () => {
    expect(formatDecimal(0.1 + 0.2)).toBe('0.3')
    expect(formatDecimal(30)).toBe('30')
    expect(formatDecimal(Number.NaN)).toBe('')
  })
})

describe('units', () => {
  it('converts between kelvin and °C', () => {
    expect(kelvinToCelsius(273.15)).toBe(0)
    expect(celsiusToKelvin(1650)).toBeCloseTo(1923.15, 9)
  })

  it('formats values and durations', () => {
    expect(formatValue(1234.567, 1, 'km')).toBe('1,234.6 km')
    expect(formatValue(Number.NaN, 1)).toBe('–')
    expect(formatDuration(75)).toBe('1:15')
    expect(formatDuration(3725)).toBe('1:02:05')
  })
})

describe('chart scales', () => {
  it('maps a domain onto a range linearly', () => {
    const scale = linearScale([0, 10], [100, 0])
    expect(scale(0)).toBe(100)
    expect(scale(2.5)).toBe(75)
  })

  it('produces nice ticks that cover the data', () => {
    const { ticks, min, max } = niceTicks(0.3, 9.6)
    expect(min).toBeLessThanOrEqual(0.3)
    expect(max).toBeGreaterThanOrEqual(9.6)
    expect(ticks).toEqual([0, 2, 4, 6, 8, 10])
  })

  it('handles a flat series', () => {
    const { min, max } = niceTicks(5, 5)
    expect(min).toBeLessThan(5)
    expect(max).toBeGreaterThan(5)
  })

  it('splits categories into contiguous runs', () => {
    expect(categoryRuns([0, 1, 2, 3, 4], ['a', 'a', 'b', 'b', 'a'])).toEqual([
      { value: 'a', start: 0, end: 2 },
      { value: 'b', start: 2, end: 4 },
      { value: 'a', start: 4, end: 4 },
    ])
  })
})
