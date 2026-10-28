import { useCallback, useEffect, useState } from 'react'
import { createDefaultModel } from '../data/defaults.js'
import { sampleFlights } from '../data/sampleFlights.js'
import { parseModelFile, serializeModelFile } from './modelFile.js'
import { createScenario } from './scenarios.js'
import { loadSaved, save } from './storage.js'

// loadId changes whenever a different model is loaded (sample, New, import).
function initialState() {
  return { ...(loadSaved() ?? { model: createDefaultModel(), scenarios: [] }), loadId: 0 }
}

// Model and scenarios with auto-save and the header file actions.
export function useModelState() {
  const [state, setState] = useState(initialState)
  const [fileError, setFileError] = useState(null)
  const { model, scenarios, loadId } = state

  useEffect(() => {
    save(model, scenarios)
  }, [model, scenarios])

  const updateModel = useCallback(
    (key, value) => setState((s) => ({ ...s, model: { ...s.model, [key]: value } })),
    [],
  )

  function replaceModel(next, question) {
    if (!window.confirm(question)) return
    setState((s) => ({ ...s, model: next, loadId: s.loadId + 1 }))
    setFileError(null)
  }

  function loadSample(id) {
    const sample = sampleFlights.find((s) => s.id === id)
    if (sample) replaceModel(sample.build(), `Replace the current model with the sample "${sample.name}"?`)
  }

  function startNew() {
    replaceModel(createDefaultModel(), 'Replace the current model with the default model?')
  }

  function exportFile() {
    const blob = new Blob([serializeModelFile(model, scenarios)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hypersonic-flight-lab.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file) {
    let parsed
    try {
      parsed = parseModelFile(await file.text())
    } catch {
      parsed = { ok: false, error: 'The file could not be read.' }
    }
    if (!parsed.ok) {
      setFileError(`Import failed (${file.name}): ${parsed.error}\nYour current data is unchanged.`)
      return
    }
    if (!window.confirm(`Replace the current model and scenarios with "${file.name}"?`)) return
    setState((s) => ({ model: parsed.model, scenarios: parsed.scenarios, loadId: s.loadId + 1 }))
    setFileError(null)
  }

  const saveScenario = (name, result) =>
    setState((s) => ({ ...s, scenarios: [...s.scenarios, createScenario(name, s.model, result)] }))
  const deleteScenario = (id) => setState((s) => ({ ...s, scenarios: s.scenarios.filter((x) => x.id !== id) }))

  return {
    model,
    scenarios,
    loadId,
    fileError,
    clearFileError: () => setFileError(null),
    updateModel,
    loadSample,
    startNew,
    exportFile,
    importFile,
    saveScenario,
    deleteScenario,
  }
}
