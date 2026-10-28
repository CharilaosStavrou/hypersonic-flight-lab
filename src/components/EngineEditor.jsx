import EditorSection from './EditorSection.jsx'
import NumberField from './NumberField.jsx'
import { engineLabels } from '../lib/engineStyle.js'
import { engineOrder } from '../physics/engine.js'

function EngineEditor({ engineRanges, onChange }) {
  const set = (name, patch) => onChange({ ...engineRanges, [name]: { ...engineRanges[name], ...patch } })

  // min must stay below max of the same engine
  const minValidator = (name) => (v) =>
    v < 0 ? 'Must be ≥ 0' : v >= engineRanges[name].max ? `Must be below max (${engineRanges[name].max})` : null
  const maxValidator = (name) => (v) =>
    v <= engineRanges[name].min ? `Must be above min (${engineRanges[name].min})` : null

  return (
    <EditorSection title="Engine ranges (Mach)" defaultOpen={false}>
      <table className="keyframeTable">
        <thead>
          <tr>
            <th>Engine</th>
            <th>From</th>
            <th>To</th>
          </tr>
        </thead>
        <tbody>
          {engineOrder.map((name) => (
            <tr key={name}>
              <td>{engineLabels[name]}</td>
              <td>
                <NumberField compact value={engineRanges[name].min} decimals={2} validate={minValidator(name)} onChange={(v) => set(name, { min: v })} />
              </td>
              <td>
                <NumberField compact value={engineRanges[name].max} decimals={2} validate={maxValidator(name)} onChange={(v) => set(name, { max: v })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">Where ranges overlap, the higher-speed engine is used (and noted in the results).</p>
    </EditorSection>
  )
}

export default EngineEditor
