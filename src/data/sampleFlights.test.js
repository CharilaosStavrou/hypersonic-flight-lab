import { describe, expect, it } from 'vitest'
import { sampleFlights } from './sampleFlights.js'
import { simulateFlight } from '../physics/simulation.js'

function run(id, materialId) {
  const model = sampleFlights.find((s) => s.id === id).build()
  if (materialId) model.vehicle.materialId = materialId
  return simulateFlight(model)
}

describe('sample flights', () => {
  it('Mach 10 run passes through all three engine modes, reaches Mach 10 near 30 km and stays below the q limit', () => {
    const result = run('mach10Blunt')
    const modes = new Set(result.samples.map((s) => s.engineMode))
    expect([...modes]).toEqual(expect.arrayContaining(['turbojet', 'ramjet', 'scramjet']))
    expect(result.peaks.mach.value).toBe(10)
    expect(result.samples.find((s) => s.mach === 10).altitude).toBe(30000)
    expect(result.exceedances.dynamicPressure).toBeNull()
  })

  it('a larger nose radius brings the failing Mach 10 run under the carbon-carbon limit', () => {
    expect(run('mach10Sharp').verdict.survives).toBe(false)
    expect(run('mach10Sharp').verdict.firstExceeded.kind).toBe('wallTemperature')
    expect(run('mach10Blunt').verdict.survives).toBe(true)
  })

  it('cruise at Mach 6–8: titanium fails, carbon-carbon survives', () => {
    const titanium = run('cruiseParisTokyo', 'ti6al4v')
    expect(titanium.verdict.survives).toBe(false)
    expect(titanium.verdict.firstExceeded.kind).toBe('wallTemperature')
    const carbon = run('cruiseParisTokyo', 'carbonCarbon')
    expect(carbon.verdict.survives).toBe(true)
    const cruiseMach = carbon.samples.filter((s) => s.altitude === 32000).map((s) => s.mach)
    expect(Math.min(...cruiseMach)).toBeGreaterThanOrEqual(6)
    expect(Math.max(...cruiseMach)).toBeLessThanOrEqual(8)
  })

  it('both routes are flown to the destination during the final approach', () => {
    for (const id of ['mach10Blunt', 'cruiseParisTokyo']) {
      const result = run(id)
      expect(result.arrivalTime).not.toBeNull()
      expect(result.samples.at(-1).altitude).toBeLessThan(1000)
    }
  })

  it('builds independent models', () => {
    const a = sampleFlights[0].build()
    a.profile[0].mach = 99
    expect(sampleFlights[0].build().profile[0].mach).toBe(0)
  })
})
