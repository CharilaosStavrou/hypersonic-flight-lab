import { useMemo } from 'react'
import LineChart from './LineChart.jsx'
import { categoryRuns } from '../lib/chartScale.js'
import { engineColors, engineLabels } from '../lib/engineStyle.js'
import { engineOrder } from '../physics/engine.js'
import { kelvinToCelsius, metresToKm, pascalToKpa, wattsToMw } from '../lib/units.js'

const accent = '#3fb6ff'

function buildSeries({ samples }) {
  const values = (key, convert = (v) => v) => samples.map((s) => convert(s[key]))
  const times = samples.map((s) => s.time)
  const runs = categoryRuns(times, samples.map((s) => s.engineMode))
  return {
    times,
    runs,
    bands: runs.map((r) => ({ ...r, color: engineColors[r.value] })),
    altitude: [{ label: 'Altitude', values: values('altitude', metresToKm), color: accent }],
    mach: [{ label: 'Mach', values: values('mach'), color: accent }],
    wall: [{ label: 'Nose wall temperature', values: values('wallTemperature', kelvinToCelsius), color: accent }],
    q: [{ label: 'Dynamic pressure q', values: values('dynamicPressure', pascalToKpa), color: accent }],
    heatFlux: [{ label: 'Heat flux qs', values: values('heatFlux', wattsToMw), color: accent }],
  }
}

function ChartsPanel({ result, time }) {
  const { verdict } = result
  const data = useMemo(() => buildSeries(result), [result])
  const { times, runs, bands } = data
  const legendModes = runs.some((r) => r.value === 'none') ? [...engineOrder, 'none'] : engineOrder
  const engineLegend = legendModes.map((mode) => (
    <span key={mode} className="legendItem">
      <span className="legendSwatch legendBand" style={{ background: engineColors[mode] }} />
      {engineLabels[mode]}
    </span>
  ))

  return (
    <div className="charts">
      <LineChart title="Altitude" unit="km" times={times} yMin={0} decimals={0} series={data.altitude} cursorTime={time} />
      <LineChart title="Mach and engine mode" times={times} yMin={0} decimals={1} bands={bands} legend={engineLegend} series={data.mach} cursorTime={time} />
      <LineChart
        title="Nose wall temperature (hot-wall)"
        unit="°C"
        times={times}
        series={data.wall}
        cursorTime={time}
        limit={{ value: kelvinToCelsius(verdict.materialLimit), label: `${verdict.materialName} limit` }}
      />
      <LineChart
        title="Dynamic pressure"
        unit="kPa"
        times={times}
        yMin={0}
        series={data.q}
        cursorTime={time}
        limit={{ value: pascalToKpa(verdict.maxDynamicPressure), label: 'q limit' }}
      />
      <LineChart title="Nose heat flux (Sutton–Graves, cold-wall)" unit="MW/m²" times={times} yMin={0} decimals={2} series={data.heatFlux} cursorTime={time} />
    </div>
  )
}

export default ChartsPanel
