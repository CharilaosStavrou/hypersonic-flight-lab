import { linearScale, niceTicks } from './chartScale.js'

export const chartSize = { width: 640, height: 210, left: 58, right: 14, top: 10, bottom: 34 }
export const plotWidth = chartSize.width - chartSize.left - chartSize.right
export const plotHeight = chartSize.height - chartSize.top - chartSize.bottom

// Axes, scales and SVG paths for a line chart against time.
export function chartLayout(times, series, limitValue, yMin) {
  const allValues = series.flatMap((s) => s.values).concat(limitValue === undefined ? [] : [limitValue])
  const dataMin = Math.min(yMin ?? Infinity, ...allValues)
  const dataMax = Math.max(...allValues)
  const yAxis = niceTicks(dataMin, dataMax)
  // Without a fixed yMin, start just below the data when rounding down to a
  // whole tick step would waste more than 10 % of the axis.
  const yDomainMin =
    yMin === undefined && dataMin - yAxis.min > 0.1 * (yAxis.max - yAxis.min)
      ? dataMin - 0.05 * (dataMax - dataMin)
      : yAxis.min
  const tStart = times[0]
  const tEnd = times[times.length - 1]
  const x = linearScale([tStart, tEnd], [chartSize.left, chartSize.left + plotWidth])
  const y = linearScale([yDomainMin, yAxis.max], [chartSize.top + plotHeight, chartSize.top])
  const paths = series.map((s) =>
    s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(times[i]).toFixed(1)},${y(v).toFixed(1)}`).join(''),
  )
  return {
    x,
    y,
    paths,
    yTicks: yAxis.ticks.filter((t) => t >= yDomainMin),
    xTicks: niceTicks(tStart, tEnd, 8).ticks.filter((t) => t >= tStart && t <= tEnd),
  }
}
