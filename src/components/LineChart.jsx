import { linearScale, niceTicks } from '../lib/chartScale.js'
import { formatValue } from '../lib/units.js'

const width = 640
const height = 210
const margin = { left: 58, right: 14, top: 10, bottom: 34 }
const plotWidth = width - margin.left - margin.right
const plotHeight = height - margin.top - margin.bottom

function pathFor(times, values, x, y) {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(times[i]).toFixed(1)},${y(v).toFixed(1)}`).join('')
}

// SVG line chart against time.
// series: [{ label, values, color }]; limit: { value, label } drawn dashed;
// bands: [{ start, end, color }] drawn behind the lines.
function LineChart({ title, unit, times, series, limit, bands = [], legend, yMin, decimals = 0 }) {
  const allValues = series.flatMap((s) => s.values).concat(limit ? [limit.value] : [])
  const dataMin = Math.min(yMin ?? Infinity, ...allValues)
  const dataMax = Math.max(...allValues)
  const yAxis = niceTicks(dataMin, dataMax)
  // Without a fixed yMin, start just below the data when rounding down to a
  // whole tick step would waste more than 10 % of the axis.
  const yDomainMin =
    yMin === undefined && dataMin - yAxis.min > 0.1 * (yAxis.max - yAxis.min)
      ? dataMin - 0.05 * (dataMax - dataMin)
      : yAxis.min
  const yTicks = yAxis.ticks.filter((t) => t >= yDomainMin)
  const xAxis = niceTicks(times[0], times[times.length - 1], 8)
  const x = linearScale([times[0], times[times.length - 1]], [margin.left, margin.left + plotWidth])
  const y = linearScale([yDomainMin, yAxis.max], [margin.top + plotHeight, margin.top])
  const xTicks = xAxis.ticks.filter((t) => t >= times[0] && t <= times[times.length - 1])

  return (
    <figure className="chart">
      <figcaption>
        <span className="chartTitle">
          {title} {unit && <span className="chartUnit">({unit})</span>}
        </span>
        <span className="chartLegend">
          {series.map((s) => (
            <span key={s.label} className="legendItem">
              <span className="legendSwatch" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
          {limit && (
            <span className="legendItem">
              <span className="legendDash" />
              {limit.label}
            </span>
          )}
          {legend}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} against time`}>
        {bands.map((b) => (
          <rect key={`${b.start}-${b.value}`} x={x(b.start)} y={margin.top} width={Math.max(0, x(b.end) - x(b.start))} height={plotHeight} fill={b.color} opacity="0.22" />
        ))}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line className="gridLine" x1={margin.left} x2={margin.left + plotWidth} y1={y(t)} y2={y(t)} />
            <text className="tickLabel" x={margin.left - 6} y={y(t) + 4} textAnchor="end">
              {formatValue(t, decimals)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} className="tickLabel" x={x(t)} y={height - 16} textAnchor="middle">
            {formatValue(t, 0)}
          </text>
        ))}
        <text className="axisLabel" x={margin.left + plotWidth / 2} y={height - 2} textAnchor="middle">
          Time (s)
        </text>
        <rect className="plotFrame" x={margin.left} y={margin.top} width={plotWidth} height={plotHeight} />
        {limit && <line className="limitLine" x1={margin.left} x2={margin.left + plotWidth} y1={y(limit.value)} y2={y(limit.value)} />}
        {series.map((s) => (
          <path key={s.label} d={pathFor(times, s.values, x, y)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
        ))}
      </svg>
    </figure>
  )
}

export default LineChart
