import { useMemo, useState } from 'react'
import ChartsPanel from './components/ChartsPanel.jsx'
import Header from './components/Header.jsx'
import Notes from './components/Notes.jsx'
import Sidebar from './components/Sidebar.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import Verdict from './components/Verdict.jsx'
import { createDefaultModel } from './data/defaults.js'
import { simulateFlight } from './physics/simulation.js'

function runSimulation(model) {
  try {
    return { result: simulateFlight(model), error: null }
  } catch (error) {
    return { result: null, error: error.message }
  }
}

function App() {
  const [model, setModel] = useState(createDefaultModel)
  const { result, error } = useMemo(() => runSimulation(model), [model])

  const updateModel = (key, value) => setModel((current) => ({ ...current, [key]: value }))

  function startNew() {
    if (window.confirm('Replace the current model with the default model?')) setModel(createDefaultModel())
  }

  return (
    <div className="app">
      <Header onNew={startNew} />
      <div className="layout">
        <Sidebar model={model} onChange={updateModel} />
        <main className="results">
          {error && (
            <div className="errorBanner" role="alert">
              <strong>Cannot simulate:</strong>
              <pre>{error}</pre>
            </div>
          )}
          {result && (
            <>
              <Verdict result={result} />
              <SummaryCards result={result} />
              <Notes notes={result.notes} />
              <ChartsPanel result={result} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
