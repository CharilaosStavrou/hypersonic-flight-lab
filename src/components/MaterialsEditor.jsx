import EditorSection from './EditorSection.jsx'
import NumberField from './NumberField.jsx'
import TextField from './TextField.jsx'
import { celsiusToKelvin, kelvinToCelsius } from '../lib/units.js'

const aboveAbsoluteZero = (v) => (v <= -273.15 ? 'Must be above −273.15 °C' : null)

function MaterialsEditor({ materials, selectedId, onChange }) {
  const update = (id, patch) => onChange(materials.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  const remove = (id) => onChange(materials.filter((m) => m.id !== id))

  function add() {
    const id = `material${Date.now()}`
    onChange([...materials, { id, name: 'New material', maxServiceTemperature: celsiusToKelvin(500), note: '' }])
  }

  return (
    <EditorSection title="Materials" defaultOpen={false}>
      <ul className="materialList">
        {materials.map((m) => (
          <li key={m.id}>
            <div className="materialRow">
              <TextField label="Name" value={m.name} onChange={(name) => update(m.id, { name })} />
              <NumberField
                label="Max service temp."
                unit="°C"
                value={kelvinToCelsius(m.maxServiceTemperature)}
                decimals={1}
                validate={aboveAbsoluteZero}
                onChange={(v) => update(m.id, { maxServiceTemperature: celsiusToKelvin(v) })}
              />
              <button
                type="button"
                className="iconButton"
                onClick={() => remove(m.id)}
                disabled={m.id === selectedId}
                title={m.id === selectedId ? 'The selected nose material cannot be deleted' : 'Delete material'}
                aria-label={`Delete ${m.name}`}
              >
                ×
              </button>
            </div>
            {m.note && <p className="hint">{m.note}</p>}
          </li>
        ))}
      </ul>
      <button type="button" className="secondaryButton" onClick={add}>
        + Add material
      </button>
      <p className="hint">Approximate literature values; they vary by source, exposure time and loading.</p>
    </EditorSection>
  )
}

export default MaterialsEditor
