import EditorSection from './EditorSection.jsx'
import NumberField from './NumberField.jsx'
import { between, greaterThan } from '../lib/validators.js'

const positiveMetres = greaterThan(0, ' m')
const emissivityRange = (v) => (v <= 0 || v > 1 ? 'Must be greater than 0 and at most 1' : null)

function VehicleEditor({ vehicle, materials, onChange }) {
  const set = (patch) => onChange({ ...vehicle, ...patch })
  return (
    <EditorSection title="Vehicle">
      <div className="fieldGrid">
        <NumberField label="Length" unit="m" value={vehicle.length} validate={between(1, 200, ' m')} onChange={(v) => set({ length: v })} />
        <NumberField label="Wingspan" unit="m" value={vehicle.wingspan} validate={between(1, 200, ' m')} onChange={(v) => set({ wingspan: v })} />
        <NumberField label="Nose radius" unit="m" value={vehicle.noseRadius} validate={positiveMetres} onChange={(v) => set({ noseRadius: v })} />
        <NumberField label="Emissivity ε" value={vehicle.emissivity} validate={emissivityRange} onChange={(v) => set({ emissivity: v })} />
      </div>
      <div className="field">
        <label htmlFor="vehicleMaterial">Nose material</label>
        <select id="vehicleMaterial" value={vehicle.materialId} onChange={(e) => set({ materialId: e.target.value })}>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <p className="hint">The nose radius drives the stagnation-point heating: qs ∝ 1 ÷ √rn.</p>
    </EditorSection>
  )
}

export default VehicleEditor
