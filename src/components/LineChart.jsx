import { useMemo } from 'react'
import { chartLayout, chartSize, plotHeight, plotWidth } from '../lib/chartLayout.js'
import { formatValue } from '../lib/units.js'

const { width, height, left, top } = chartSize

// SVG line chart against time.
// series: [{ label, values, color }]; limit: { value, label } drawn dashed;
// bands: [{ start, end, color }] drawn behind the lines; cursorTime: timeline position.
function LineChart({ title, unit, times, series, limit, bands = [], legend, yMin, decimals = 0, cursorTime }) {
  const limitValue = limit?.value
  // Axes and paths depend only on the data, not on the cursor.
  const { x, y, paths, yTicks, xTicks } = useMemo(
    () => chartLayout(times, series, limitValue, yMin),
    [times, series, limitValue, yMin],
  )

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
          <rect key={`${b.start}-${b.value}`} x={x(b.start)} y={top} width={Math.max(0, x(b.end) - x(b.start))} height={plotHeight} fill={b.color} opacity="0.22" />
        ))}
        {yTicks.map((t) => (
          <g key={`y${t}`}>
            <line className="gridLine" x1={left} x2={left + plotWidth} y1={y(t)} y2={y(t)} />
            <text className="tickLabel" x={left - 6} y={y(t) + 4} textAnchor="end">
              {formatValue(t, decimals)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={`x${t}`} className="tickLabel" x={x(t)} y={height - 16} textAnchor="middle">
            {formatValue(t, 0)}
          </text>
        ))}
        <text className="axisLabel" x={left + plotWidth / 2} y={height - 2} textAnchor="middle">
          Time (s)
        </text>
        <rect className="plotFrame" x={left} y={top} width={plotWidth} height={plotHeight} />
        {limit && <line className="limitLine" x1={left} x2={left + plotWidth} y1={y(limit.value)} y2={y(limit.value)} />}
        {series.map((s, i) => (
          <path key={s.label} d={paths[i]} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
        ))}
        {cursorTime !== undefined && (
          <line className="cursorLine" x1={x(cursorTime)} x2={x(cursorTime)} y1={top} y2={top + plotHeight} />
        )}
      </svg>
    </figure>
  )
}

export default LineChart
