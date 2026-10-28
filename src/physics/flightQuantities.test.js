import { describe, expect, it } from 'vitest'
import { engineMode } from './engine.js'
import { centrifugalRelief, effectiveGravity, effectiveWeightPercent } from './gravity.js'
import { exceedsMaterialLimit, findMaterial } from './materials.js'
import { defaultEngineRanges } from '../data/defaults.js'
import { defaultMaterials } from '../data/materials.js'

describe('engineMode (default ranges: turbojet 0–3, ramjet 3–6, scramjet 5–12)', () => {
  it('picks the single engine inside one range', () => {
    expect(engineMode(1.5, defaultEngineRanges)).toMatchObject({ mode: 'turbojet', overlap: false })
    expect(engineMode(4, defaultEngineRanges)).toMatchObject({ mode: 'ramjet', overlap: false })
    expect(engineMode(10, defaultEngineRanges)).toMatchObject({ mode: 'scramjet', overlap: false })
  })

  it('hands over at a shared boundary to the higher-speed engine without flagging overlap', () => {
    expect(engineMode(3, defaultEngineRanges)).toMatchObject({ mode: 'ramjet', overlap: false })
  })

  it('picks the higher-speed engine in an overlap and flags it', () => {
    expect(engineMode(5.5, defaultEngineRanges)).toMatchObject({
      mode: 'scramjet',
      overlap: true,
      candidates: ['ramjet', 'scramjet'],
    })
  })

  it('reports "none" outside every range', () => {
    expect(engineMode(13, defaultEngineRanges).mode).toBe('none')
  })

  it('uses edited ranges', () => {
    const ranges = { turbojet: { min: 0, max: 2.5 }, ramjet: { min: 2.5, max: 7 }, scramjet: { min: 7, max: 15 } }
    expect(engineMode(6, ranges).mode).toBe('ramjet')
    expect(engineMode(14, ranges).mode).toBe('scramjet')
  })
})

describe('gravity and centrifugal relief', () => {
  it('g(0) = g0 and g(30 km) = g0 × (6371 ÷ 6401)² ≈ 9.7149 m/s²', () => {
    expect(effectiveGravity(0)).toBe(9.80665)
    expect(effectiveGravity(30000)).toBeCloseTo(9.714942, 5)
  })

  it('Mach 10 at 30 km: relief = 3017.09² ÷ 6401000 ≈ 1.422 m/s², wings carry ≈ 85.4 %', () => {
    expect(centrifugalRelief(3017.09, 30000)).toBeCloseTo(1.42209, 4)
    expect(effectiveWeightPercent(3017.09, 30000)).toBeCloseTo(85.362, 2)
  })

  it('is 100 % at rest and ≈ 0 % at circular orbital speed', () => {
    expect(effectiveWeightPercent(0, 0)).toBe(100)
    const r = 6371000 + 30000
    const orbitalSpeed = Math.sqrt(effectiveGravity(30000) * r)
    expect(effectiveWeightPercent(orbitalSpeed, 30000)).toBeCloseTo(0, 9)
  })
})

describe('materials', () => {
  it('ships the four default materials with limits in kelvin, ordered by temperature', () => {
    const limits = defaultMaterials.map((m) => m.maxServiceTemperature)
    expect(limits).toEqual([...limits].sort((a, b) => a - b))
    expect(defaultMaterials).toHaveLength(4)
  })

  it('finds a material by id and checks the limit strictly', () => {
    const titanium = findMaterial(defaultMaterials, 'ti6al4v')
    expect(titanium.name).toMatch(/Ti-6Al-4V/)
    expect(exceedsMaterialLimit(673.15, titanium)).toBe(false)
    expect(exceedsMaterialLimit(673.16, titanium)).toBe(true)
    expect(findMaterial(defaultMaterials, 'unobtainium')).toBeNull()
  })
})
