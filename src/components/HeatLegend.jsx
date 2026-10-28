import { heatDomain, heatGradientCss } from '../lib/heatColor.js'
import { formatValue, kelvinToCelsius } from '../lib/units.js'

const ticks = [heatDomain.min, 800, 1400, 2000, heatDomain.max]

// Legend for the cool-to-hot temperature colour scale.
function HeatLegend({ title = 'Nose wall temperature (hot-wall)' }) {
  const span = heatDomain.max - heatDomain.min
  return (
    <div className="heatLegend">
      <div className="heatLegendTitle">{title}</div>
      <div className="heatLegendBar" style={{ background: heatGradientCss() }} />
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
