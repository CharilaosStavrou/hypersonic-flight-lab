import EditorSection from './EditorSection.jsx'
import NumberField from './NumberField.jsx'
import { routePresets } from '../data/routePresets.js'
import { centralAngle, greatCircleDistance } from '../physics/geodesy.js'
import { between } from '../lib/validators.js'
import { formatValue, metresToKm } from '../lib/units.js'

const latitude = between(-90, 90, '°')
const longitude = between(-180, 180, '°')

function routeProblem({ startLat, startLon, endLat, endLon }) {
  const angle = centralAngle(startLat, startLon, endLat, endLon)
  if (angle < 1e-6) return 'Start and end must be different points'
  if (Math.PI - angle < 1e-6) return 'Start and end are antipodal: the great circle is not unique'
  return null
}

function RouteEditor({ route, onChange }) {
  const matching = routePresets.find((p) =>
    ['startLat', 'startLon', 'endLat', 'endLon'].every((key) => p[key] === route[key]),
  )

  // Coordinates are validated together: a change that would make the route
  // degenerate is rejected like any other invalid value.
  const fieldValidator = (key, rangeCheck) => (v) =>
    rangeCheck(v) ?? routeProblem({ ...route, [key]: v })

  function applyPreset(event) {
    const preset = routePresets.find((p) => p.id === event.target.value)
    if (!preset) return
    const { startLat, startLon, endLat, endLon } = preset
    onChange({ startLat, startLon, endLat, endLon })
  }

  const field = (key, label, rangeCheck) => (
    <NumberField
      label={label}
      unit="°"
      value={route[key]}
      validate={fieldValidator(key, rangeCheck)}
      onChange={(v) => onChange({ ...route, [key]: v })}
    />
  )

  const distance = greatCircleDistance(route.startLat, route.startLon, route.endLat, route.endLon)

  return (
    <EditorSection title="Route">
      <div className="field">
        <label htmlFor="routePreset">Preset</label>
        <select id="routePreset" value={matching?.id ?? ''} onChange={applyPreset}>
          <option value="">Custom</option>
          {routePresets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="fieldGrid">
        {field('startLat', 'Start latitude', latitude)}
        {field('startLon', 'Start longitude', longitude)}
        {field('endLat', 'End latitude', latitude)}
        {field('endLon', 'End longitude', longitude)}
      </div>
      <p className="hint">
        Great-circle distance: {formatValue(metresToKm(distance), 0, 'km')}. North and east are positive.
      </p>
    </EditorSection>
  )
}

export default RouteEditor
