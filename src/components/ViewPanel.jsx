import { lazy, Suspense, useState } from 'react'
import Hud from './Hud.jsx'
import Timeline from './Timeline.jsx'
import ViewTabs from './ViewTabs.jsx'

const EarthView = lazy(() => import('./EarthView.jsx'))
const AircraftView = lazy(() => import('./AircraftView.jsx'))

// Earth / aircraft tabs, the HUD and the shared timeline.
function ViewPanel({ model, result, state, playback }) {
  const [view, setView] = useState('earth')
  const start = result.samples[0].time
  const end = result.samples[result.samples.length - 1].time
  return (
    <section className="viewPanel" aria-label="3D view">
      <ViewTabs active={view} onChange={setView} />
      <div className="viewStage">
        <Suspense fallback={<div className="view3d viewLoading">Loading 3D view…</div>}>
          {view === 'earth' ? (
            <EarthView result={result} route={model.route} time={state.time} />
          ) : (
            <AircraftView result={result} vehicle={model.vehicle} state={state} />
          )}
        </Suspense>
        <Hud state={state} verdict={result.verdict} />
      </div>
      <Timeline playback={playback} start={start} end={end} />
    </section>
  )
}

export default ViewPanel
