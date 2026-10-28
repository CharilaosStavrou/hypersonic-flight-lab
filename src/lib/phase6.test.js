import { describe, expect, it } from 'vitest'
import { sampleAt } from './sampleAt.js'
import { createScenario, isValidScenario } from './scenarios.js'
import { fileFormat, parseModelFile, serializeModelFile } from './modelFile.js'
import { loadSaved, save } from './storage.js'
import { createDefaultModel } from '../data/defaults.js'
import { sampleFlights } from '../data/sampleFlights.js'
import { simulateFlight } from '../physics/simulation.js'
import { validateModel } from '../physics/validation.js'

const samples = [
  { time: 0, altitude: 0, mach: 0, latitude: 0, longitude: 179, engineMode: 'turbojet' },
  { time: 1, altitude: 100, mach: 1, latitude: 1, longitude: -179, engineMode: 'ramjet' },
  { time: 2, altitude: 300, mach: 3, latitude: 2, longitude: -178, engineMode: 'ramjet' },
]

describe('sampleAt', () => {
  it('interpolates numeric fields linearly', () => {
    const s = sampleAt(samples, 1.5)
    expect(s).toMatchObject({ time: 1.5, altitude: 200, mach: 2, latitude: 1.5 })
  })

  it('takes categorical fields from the sample at or before t', () => {
    expect(sampleAt(samples, 0.9).engineMode).toBe('turbojet')
    expect(sampleAt(samples, 1).engineMode).toBe('ramjet')
  })

  it('interpolates longitude the short way across the antimeridian', () => {
    expect(sampleAt(samples, 0.25).longitude).toBeCloseTo(179.5, 9)
    expect(sampleAt(samples, 0.75).longitude).toBeCloseTo(-179.5, 9)
  })

  it('clamps outside the flight', () => {
    expect(sampleAt(samples, -5)).toBe(samples[0])
    expect(sampleAt(samples, 99)).toBe(samples[2])
  })
})

describe('scenarios', () => {
  it('summarises a result for comparison', () => {
    const model = createDefaultModel()
    const result = simulateFlight(model)
    const scenario = createScenario('  Base  ', model, result)
    expect(scenario).toMatchObject({
      name: 'Base',
      materialName: 'Carbon-carbon composite',
      noseRadius: 0.1,
      peakWallTemperature: result.peaks.wallTemperature.value,
      peakDynamicPressure: result.peaks.dynamicPressure.value,
      survives: result.verdict.survives,
      firstExceeded: result.verdict.firstExceeded,
    })
    expect(isValidScenario(scenario)).toBe(true)
  })

  it('rejects malformed scenarios', () => {
    const scenario = createScenario('x', createDefaultModel(), simulateFlight(createDefaultModel()))
    expect(isValidScenario(null)).toBe(false)
    expect(isValidScenario({ ...scenario, peakMach: 'fast' })).toBe(false)
    expect(isValidScenario({ ...scenario, survives: true, firstExceeded: { kind: 'other', time: 1, value: 1 } })).toBe(false)
    expect(isValidScenario({ ...scenario, survives: false, firstExceeded: null })).toBe(false)
  })
})

describe('model file', () => {
  const model = createDefaultModel()

  it('round-trips model and scenarios', () => {
    const scenario = createScenario('A', model, simulateFlight(model))
    const parsed = parseModelFile(serializeModelFile(model, [scenario]))
    expect(parsed).toEqual({ ok: true, model, scenarios: [scenario] })
  })

  it.each([
    ['not JSON', '{oops', /not valid JSON/],
    ['wrong format', JSON.stringify({ format: 'other' }), /not a Hypersonic Flight Lab file/],
    ['wrong version', JSON.stringify({ format: fileFormat, version: 9 }), /Unsupported file version/],
    ['missing model', JSON.stringify({ format: fileFormat, version: 1 }), /no "model" object/],
    ['profile not a list', JSON.stringify({ format: fileFormat, version: 1, model: { ...model, profile: 5 } }), /model.profile/],
    ['null keyframe', JSON.stringify({ format: fileFormat, version: 1, model: { ...model, profile: [null, null] } }), /must be an object/],
    ['duplicate material id', JSON.stringify({ format: fileFormat, version: 1, model: { ...model, materials: [model.materials[0], model.materials[0]] } }), /unique/],
    ['invalid physics', JSON.stringify({ format: fileFormat, version: 1, model: { ...model, vehicle: { ...model.vehicle, noseRadius: -1 } } }), /Nose radius/],
    ['too many scenarios', JSON.stringify({ format: fileFormat, version: 1, model, scenarios: [1, 2, 3, 4, 5] }), /at most 4/],
  ])('rejects %s with a clear message', (_, text, message) => {
    const parsed = parseModelFile(text)
    expect(parsed.ok).toBe(false)
    expect(parsed.error).toMatch(message)
  })

  it('drops unknown top-level model keys', () => {
    const parsed = parseModelFile(JSON.stringify({ format: fileFormat, version: 1, model: { ...model, extra: 1 } }))
    expect(parsed.model.extra).toBeUndefined()
  })
})

describe('storage', () => {
  function memoryStorage() {
    const data = new Map()
    return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) }
  }

  it('saves and loads the model', () => {
    const storage = memoryStorage()
    const model = createDefaultModel()
    expect(save(model, [], storage)).toBe(true)
    expect(loadSaved(storage)).toEqual({ model, scenarios: [] })
  })

  it('returns null for empty, corrupt or throwing storage', () => {
    expect(loadSaved(memoryStorage())).toBeNull()
    expect(loadSaved({ getItem: () => '{bad' })).toBeNull()
    const throwing = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('full') } }
    expect(loadSaved(throwing)).toBeNull()
    expect(save(createDefaultModel(), [], throwing)).toBe(false)
  })
})

describe('sample flights', () => {
  it('are valid models that simulate', () => {
    for (const sample of sampleFlights) {
      const model = sample.build()
      expect(validateModel(model), sample.name).toEqual([])
      expect(() => simulateFlight(model)).not.toThrow()
    }
  })
})
