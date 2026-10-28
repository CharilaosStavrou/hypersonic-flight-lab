import { validateModel } from '../physics/validation.js'
import { isValidScenario, maxScenarios } from './scenarios.js'

export const fileFormat = 'hypersonic-flight-lab'
export const fileVersion = 1

export function serializeModelFile(model, scenarios) {
  return JSON.stringify({ format: fileFormat, version: fileVersion, model, scenarios }, null, 2)
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// Shape checks that must pass before validateModel can safely read the model.
function structureProblem(model) {
  if (!isObject(model)) return 'The file has no "model" object'
  for (const key of ['route', 'vehicle', 'limits', 'engineRanges']) {
    if (!isObject(model[key])) return `"model.${key}" is missing or not an object`
  }
  for (const key of ['profile', 'materials']) {
    if (!Array.isArray(model[key])) return `"model.${key}" is missing or not a list`
    if (!model[key].every(isObject)) return `Every entry of "model.${key}" must be an object`
  }
  if (!model.materials.every((m) => typeof m.id === 'string')) return 'Every material needs a text "id"'
  if (new Set(model.materials.map((m) => m.id)).size !== model.materials.length) return 'Material ids must be unique'
  return null
}

// Parses and validates a model file. Returns { ok: true, model, scenarios }
// or { ok: false, error } with a message for the user.
export function parseModelFile(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }
  if (!isObject(data) || data.format !== fileFormat) {
    return { ok: false, error: 'This is not a Hypersonic Flight Lab file (missing "format": "hypersonic-flight-lab").' }
  }
  if (data.version !== fileVersion) return { ok: false, error: `Unsupported file version ${data.version}; expected ${fileVersion}.` }
  const problem = structureProblem(data.model)
  if (problem) return { ok: false, error: problem }
  const errors = validateModel(data.model)
  if (errors.length > 0) return { ok: false, error: `The model in the file is invalid:\n${errors.join('\n')}` }
  const scenarios = data.scenarios ?? []
  if (!Array.isArray(scenarios) || scenarios.length > maxScenarios || !scenarios.every(isValidScenario)) {
    return { ok: false, error: `"scenarios" must be a list of at most ${maxScenarios} valid scenario snapshots.` }
  }
  const model = {
    route: data.model.route,
    profile: data.model.profile,
    vehicle: data.model.vehicle,
    limits: data.model.limits,
    engineRanges: data.model.engineRanges,
    materials: data.model.materials,
  }
  return { ok: true, model, scenarios }
}
