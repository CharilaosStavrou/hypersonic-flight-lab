import { parseModelFile, serializeModelFile } from './modelFile.js'

const storageKey = 'hypersonicFlightLab.v1'

// Auto-saved state, validated like an imported file. Returns null if absent
// or invalid (or if storage is unavailable).
export function loadSaved(storage = globalThis.localStorage) {
  try {
    const text = storage?.getItem(storageKey)
    if (!text) return null
    const parsed = parseModelFile(text)
    return parsed.ok ? { model: parsed.model, scenarios: parsed.scenarios } : null
  } catch {
    return null
  }
}

export function save(model, scenarios, storage = globalThis.localStorage) {
  try {
    storage?.setItem(storageKey, serializeModelFile(model, scenarios))
    return true
  } catch {
    return false
  }
}
