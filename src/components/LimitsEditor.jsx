import EditorSection from './EditorSection.jsx'
import NumberField from './NumberField.jsx'
import { greaterThan } from '../lib/validators.js'
import { formatValue, kelvinToCelsius, kpaToPascal, pascalToKpa } from '../lib/units.js'

function LimitsEditor({ limits, material, onChange }) {
  return (
    <EditorSection title="Limits">
      <NumberField
        label="Maximum dynamic pressure"
        unit="kPa"
        value={pascalToKpa(limits.maxDynamicPressure)}
        decimals={2}
        validate={greaterThan(0, ' kPa')}
        onChange={(v) => onChange({ ...limits, maxDynamicPressure: kpaToPascal(v) })}
      />
      <p className="hint">
        Maximum nose temperature = limit of the selected material ({material.name}):{' '}
        {formatValue(kelvinToCelsius(material.maxServiceTemperature), 0, '°C')}. Edit it in Materials.
      </p>
    </EditorSection>
  )
}

export default LimitsEditor
