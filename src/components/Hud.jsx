import { engineLabels } from '../lib/engineStyle.js'
import { formatValue, kelvinToCelsius, metresToKm, pascalToKpa } from '../lib/units.js'

function Row({ label, value, detail }) {
  return (
    <div className="hudRow">
      <span className="hudLabel">{label}</span>
      <span className="hudValue">
        {value}
        {detail && <span className="hudDetail"> {detail}</span>}
      </span>
    </div>
  )
}

// Current values at the timeline position, with the limit status as text.
function Hud({ state, verdict }) {
  const noseOver = state.wallTemperature > verdict.materialLimit
  const qOver = state.dynamicPressure > verdict.maxDynamicPressure
  const status = [noseOver && `Nose above ${verdict.materialName} limit`, qOver && 'q above limit'].filter(Boolean)
  return (
    <div className="hud" aria-label="Current flight state">
      <Row label="Time" value={formatValue(state.time, 0, 's')} />
      <Row label="Altitude" value={formatValue(metresToKm(state.altitude), 2, 'km')} />
      <Row label="Mach" value={formatValue(state.mach, 2)} />
      <Row label="Speed" value={formatValue(state.velocity / 1000, 3, 'km/s')} />
      <Row label="Engine" value={engineLabels[state.engineMode]} />
      <Row label="Nose temp." value={formatValue(kelvinToCelsius(state.wallTemperature), 0, '°C')} detail="hot-wall" />
      <Row label="" value={formatValue(kelvinToCelsius(state.coldWallTemperature), 0, '°C')} detail="cold-wall, conservative upper bound" />
      <Row label="Dyn. pressure" value={formatValue(pascalToKpa(state.dynamicPressure), 1, 'kPa')} />
      <Row label="Eff. weight" value={formatValue(state.effectiveWeightPercent, 1, '%')} detail="carried by wings" />
      <div className={`hudStatus ${status.length ? 'hudStatusFail' : 'hudStatusOk'}`} role="status">
        <span aria-hidden="true">{status.length ? '✕' : '✓'}</span> {status.length ? status.join(' · ') : 'Within limits'}
      </div>
      {verdict.firstExceeded && (
        <div className="hudNote">First limit exceeded at t = {formatValue(verdict.firstExceeded.time, 0)} s</div>
      )}
    </div>
  )
}

export default Hud
