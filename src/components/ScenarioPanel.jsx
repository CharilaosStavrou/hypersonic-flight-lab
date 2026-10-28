import { useState } from 'react'
import { maxScenarios } from '../lib/scenarios.js'
import { formatValue, kelvinToCelsius, metresToKm, pascalToKpa } from '../lib/units.js'

function firstLimitText(s) {
  if (!s.firstExceeded) return 'None'
  const what = s.firstExceeded.kind === 'wallTemperature' ? `${s.materialName} limit` : 'Dynamic pressure limit'
  return `${what} at t = ${formatValue(s.firstExceeded.time, 0)} s`
}

const rows = [
  ['Material', (s) => `${s.materialName} (≤ ${formatValue(kelvinToCelsius(s.materialLimit), 0, '°C')})`],
  ['Nose radius', (s) => formatValue(s.noseRadius, 2, 'm')],
  ['Emissivity', (s) => formatValue(s.emissivity, 2)],
  ['Peak Mach', (s) => formatValue(s.peakMach, 2)],
  ['Altitude at peak temp.', (s) => formatValue(metresToKm(s.altitudeAtPeakTemperature), 1, 'km')],
  ['Peak nose temp. (hot-wall)', (s) => formatValue(kelvinToCelsius(s.peakWallTemperature), 0, '°C')],
  ['Peak nose temp. (cold-wall bound)', (s) => formatValue(kelvinToCelsius(s.peakColdWallTemperature), 0, '°C')],
  ['Peak dynamic pressure', (s) => `${formatValue(pascalToKpa(s.peakDynamicPressure), 1, 'kPa')} (limit ${formatValue(pascalToKpa(s.maxDynamicPressure), 0)})`],
  ['First limit exceeded', firstLimitText],
]

function ScenarioPanel({ scenarios, onSave, onDelete }) {
  const [name, setName] = useState('')
  const full = scenarios.length >= maxScenarios

  function save(event) {
    event.preventDefault()
    onSave(name || `Scenario ${scenarios.length + 1}`)
    setName('')
  }

  return (
    <section className="scenarios" aria-label="Scenarios">
      <form className="scenarioForm" onSubmit={save}>
        <h2>Scenarios</h2>
        <input type="text" value={name} placeholder={`Scenario ${scenarios.length + 1}`} aria-label="Scenario name" onChange={(e) => setName(e.target.value)} disabled={full} />
        <button type="submit" className="secondaryButton" disabled={full}>
          Save current result
        </button>
        <span className="hint">{full ? `Maximum ${maxScenarios} scenarios: delete one to save another.` : `${scenarios.length} of ${maxScenarios} saved`}</span>
      </form>
      {scenarios.length > 0 && (
        <div className="scenarioTableWrap">
          <table className="scenarioTable">
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                {scenarios.map((s) => (
                  <th key={s.id} scope="col">
                    <span>{s.name}</span>
                    <button type="button" className="iconButton" onClick={() => onDelete(s.id)} aria-label={`Delete ${s.name}`}>
                      ×
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Verdict</th>
                {scenarios.map((s) => (
                  <td key={s.id} className={s.survives ? 'verdictTextOk' : 'verdictTextFail'}>
                    {s.survives ? '✓ Survives' : '✕ Exceeds a limit'}
                  </td>
                ))}
              </tr>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {scenarios.map((s) => (
                    <td key={s.id}>{value(s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ScenarioPanel
