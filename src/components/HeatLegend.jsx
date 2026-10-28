import { heatDomain, heatFraction, heatGradientCss } from '../lib/heatColor.js'
import { formatValue, kelvinToCelsius } from '../lib/units.js'

const ticks = [heatDomain.min, 800, 1400, 2000, heatDomain.max]

// Legend for the cool-to-hot temperature colour scale, with an optional
// marker for the selected material's limit (limit: { temperature K, label }).
function HeatLegend({ title = 'Nose wall temperature (hot-wall)', limit }) {
  const span = heatDomain.max - heatDomain.min
  const limitPercent = limit ? heatFraction(limit.temperature) * 100 : null
  const outside = limit && (limit.temperature < heatDomain.min || limit.temperature > heatDomain.max)
  return (
    <div className="heatLegend">
      <div className="heatLegendTitle">{title}</div>
      {limit && (
        <div className="heatLegendLimitRow">
          <span
            className="heatLegendLimitLabel"
            style={{ left: `${limitPercent}%`, transform: `translateX(${-limitPercent}%)` }}
          >
            {limit.label}: {formatValue(kelvinToCelsius(limit.temperature), 0, '°C')}
            {outside ? ' (off scale)' : ''}
          </span>
        </div>
      )}
      <div className="heatLegendBarWrap">
        <div className="heatLegendBar" style={{ background: heatGradientCss() }} />
        {limit && <span className="heatLegendLimitTick" style={{ left: `${limitPercent}%` }} aria-hidden="true" />}
      </div>
      <div className="heatLegendTicks">
        {ticks.map((t) => (
          <span key={t} style={{ left: `${((t - heatDomain.min) / span) * 100}%` }}>
            {formatValue(kelvinToCelsius(t), 0)}
          </span>
        ))}
      </div>
      <div className="heatLegendUnit">°C (colours clamp outside this range)</div>
    </div>
  )
}

export default HeatLegend
