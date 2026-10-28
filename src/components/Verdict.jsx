import { formatValue, kelvinToCelsius, pascalToKpa } from '../lib/units.js'

function describeExceedance(exceedance, verdict) {
  if (exceedance.kind === 'wallTemperature') {
    return {
      title: `Exceeds ${verdict.materialName} limit at t = ${formatValue(exceedance.time, 0)} s`,
      detail: `Nose ${formatValue(kelvinToCelsius(exceedance.value), 0, '°C')} > limit ${formatValue(kelvinToCelsius(verdict.materialLimit), 0, '°C')}`,
    }
  }
  return {
    title: `Exceeds dynamic pressure limit at t = ${formatValue(exceedance.time, 0)} s`,
    detail: `q ${formatValue(pascalToKpa(exceedance.value), 1, 'kPa')} > limit ${formatValue(pascalToKpa(verdict.maxDynamicPressure), 1, 'kPa')}`,
  }
}

// Verdict banner: colour plus an explicit text label and symbol.
function Verdict({ result }) {
  const { verdict, exceedances } = result
  if (verdict.survives) {
    return (
      <div className="verdict verdictOk" role="status">
        <span className="verdictIcon" aria-hidden="true">✓</span>
        <div>
          <div className="verdictTitle">Survives</div>
          <div className="verdictDetail">
            No limit exceeded with {verdict.materialName} (≤ {formatValue(kelvinToCelsius(verdict.materialLimit), 0, '°C')}) and q ≤{' '}
            {formatValue(pascalToKpa(verdict.maxDynamicPressure), 1, 'kPa')}
          </div>
        </div>
      </div>
    )
  }
  const first = describeExceedance(verdict.firstExceeded, verdict)
  const otherKind = verdict.firstExceeded.kind === 'wallTemperature' ? 'dynamicPressure' : 'wallTemperature'
  const other = exceedances[otherKind] && describeExceedance({ kind: otherKind, ...exceedances[otherKind] }, verdict)
  return (
    <div className="verdict verdictFail" role="status">
      <span className="verdictIcon" aria-hidden="true">✕</span>
      <div>
        <div className="verdictTitle">{first.title}</div>
        <div className="verdictDetail">{first.detail}</div>
        {other && <div className="verdictDetail">Also: {other.title.charAt(0).toLowerCase() + other.title.slice(1)}</div>}
      </div>
    </div>
  )
}

export default Verdict
