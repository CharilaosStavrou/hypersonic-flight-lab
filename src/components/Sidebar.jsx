import EngineEditor from './EngineEditor.jsx'
import LimitsEditor from './LimitsEditor.jsx'
import MaterialsEditor from './MaterialsEditor.jsx'
import ProfileEditor from './ProfileEditor.jsx'
import RouteEditor from './RouteEditor.jsx'
import VehicleEditor from './VehicleEditor.jsx'
import { findMaterial } from '../physics/materials.js'

// All model editors. `onChange(key, value)` replaces one part of the model.
function Sidebar({ model, onChange }) {
  const material = findMaterial(model.materials, model.vehicle.materialId)
  return (
    <aside className="sidebar" aria-label="Model inputs">
      <RouteEditor route={model.route} onChange={(v) => onChange('route', v)} />
      <ProfileEditor profile={model.profile} onChange={(v) => onChange('profile', v)} />
      <VehicleEditor vehicle={model.vehicle} materials={model.materials} onChange={(v) => onChange('vehicle', v)} />
      <LimitsEditor limits={model.limits} material={material} onChange={(v) => onChange('limits', v)} />
      <EngineEditor engineRanges={model.engineRanges} onChange={(v) => onChange('engineRanges', v)} />
      <MaterialsEditor materials={model.materials} selectedId={model.vehicle.materialId} onChange={(v) => onChange('materials', v)} />
    </aside>
  )
}

export default Sidebar
