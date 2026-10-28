import EditorSection from './EditorSection.jsx'
import NumberField from './NumberField.jsx'
import { all, atLeast, between } from '../lib/validators.js'
import { kmToMetres, metresToKm } from '../lib/units.js'

// Keyframe times must increase strictly; each time is checked against its neighbours.
function timeValidator(profile, index) {
  return all(atLeast(0, ' s'), (v) => {
    if (index > 0 && v <= profile[index - 1].time) return `Must be later than ${profile[index - 1].time} s`
    if (index < profile.length - 1 && v >= profile[index + 1].time) {
      return `Must be earlier than ${profile[index + 1].time} s`
    }
    return null
  })
}

const altitudeKm = between(0, 86, ' km')
const machNumber = atLeast(0)

function ProfileEditor({ profile, onChange }) {
  const update = (index, patch) =>
    onChange(profile.map((keyframe, i) => (i === index ? { ...keyframe, ...patch } : keyframe)))

  function addKeyframe() {
    const last = profile[profile.length - 1]
    onChange([...profile, { ...last, time: last.time + 60 }])
  }

  const remove = (index) => onChange(profile.filter((_, i) => i !== index))

  return (
    <EditorSection title="Flight profile">
      <table className="keyframeTable">
        <thead>
          <tr>
            <th>Time (s)</th>
            <th>Altitude (km)</th>
            <th>Mach</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {profile.map((keyframe, index) => (
            <tr key={index}>
              <td>
                <NumberField
                  compact
                  value={keyframe.time}
                  decimals={1}
                  validate={timeValidator(profile, index)}
                  onChange={(v) => update(index, { time: v })}
                />
              </td>
              <td>
                <NumberField
                  compact
                  value={metresToKm(keyframe.altitude)}
                  decimals={3}
                  validate={altitudeKm}
                  onChange={(v) => update(index, { altitude: kmToMetres(v) })}
                />
              </td>
              <td>
                <NumberField
                  compact
                  value={keyframe.mach}
                  decimals={2}
                  validate={machNumber}
                  onChange={(v) => update(index, { mach: v })}
                />
              </td>
              <td>
                <button
                  type="button"
                  className="iconButton"
                  onClick={() => remove(index)}
                  disabled={profile.length <= 2}
                  title={profile.length <= 2 ? 'A profile needs at least two keyframes' : 'Delete keyframe'}
                  aria-label={`Delete keyframe ${index + 1}`}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="secondaryButton" onClick={addKeyframe}>
        + Add keyframe
      </button>
      <p className="hint">Values are interpolated linearly between keyframes. Altitude range 0–86 km.</p>
    </EditorSection>
  )
}

export default ProfileEditor
