import { memo, useMemo } from 'react'
import ChartsPanel from './components/ChartsPanel.jsx'
import Header from './components/Header.jsx'
import Notes from './components/Notes.jsx'
import ScenarioPanel from './components/ScenarioPanel.jsx'
import Sidebar from './components/Sidebar.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import Verdict from './components/Verdict.jsx'
import ViewPanel from './components/ViewPanel.jsx'
import { sampleAt } from './lib/sampleAt.js'
import { useModelState } from './lib/useModelState.js'
import { usePlayback } from './lib/usePlayback.js'
import { simulateFlight } from './physics/simulation.js'

// Parts that do not depend on the timeline skip re-rendering during playback.
const StaticSidebar = memo(Sidebar)
const StaticVerdict = memo(Verdict)
const StaticCards = memo(SummaryCards)
const StaticNotes = memo(Notes)

function runSimulation(model) {
  try {
    return { result: simulateFlight(model), error: null }
  } catch (error) {
    return { result: null, error: error.message }
  }
}

function App() {
  const store = useModelState()
  const { model, scenarios } = store
  const { result, error } = useMemo(() => runSimulation(model), [model])
  const start = result?.samples[0].time ?? 0
  const end = result?.samples[result.samples.length - 1].time ?? 0
  const playback = usePlayback(start, end)
  const state = result ? sampleAt(result.samples, playback.time) : null

  return (
    <div className="app">
      <Header onLoadSample={store.loadSample} onNew={store.startNew} onExport={store.exportFile} onImportFile={store.importFile} />
      {store.fileError && (
        <div className="errorBanner fileError" role="alert">
          <pre>{store.fileError}</pre>
          <button type="button" className="iconButton" onClick={store.clearFileError} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <div className="layout">
        <StaticSidebar model={model} onChange={store.updateModel} />
        <main className="results">
          {error && (
            <div className="errorBanner" role="alert">
              <strong>Cannot simulate:</strong>
              <pre>{error}</pre>
            </div>
          )}
          {result && (
            <>
              <StaticVerdict result={result} />
              <StaticCards result={result} />
              <ViewPanel model={model} result={result} state={state} playback={playback} />
              <StaticNotes notes={result.notes} />
              <ChartsPanel result={result} time={playback.time} />
              <ScenarioPanel
                scenarios={scenarios}
                onSave={(name) => store.saveScenario(name, result)}
                onDelete={store.deleteScenario}
              />
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
