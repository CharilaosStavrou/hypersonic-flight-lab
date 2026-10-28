import LineChart from './LineChart.jsx'
import { categoryRuns } from '../lib/chartScale.js'
import { engineColors, engineLabels } from '../lib/engineStyle.js'
import { engineOrder } from '../physics/engine.js'
import { kelvinToCelsius, metresToKm, pascalToKpa, wattsToMw } from '../lib/units.js'

const accent = '#3fb6ff'

function ChartsPanel({ result }) {
  const { samples, verdict } = result
  const times = samples.map((s) => s.time)
  const series = (key, convert = (v) => v) => samples.map((s) => convert(s[key]))

  const runs = categoryRuns(times, samples.map((s) => s.engineMode))
  const bands = runs.map((r) => ({ ...r, color: engineColors[r.value] }))
  const legendModes = runs.some((r) => r.value === 'none') ? [...engineOrder, 'none'] : engineOrder
  const engineLegend = legendModes.map((mode) => (
    <span key={mode} className="legendItem">
      <span className="legendSwatch legendBand" style={{ background: engineColors[mode] }} />
      {engineLabels[mode]}
    </span>
  ))

  return (
    <div className="charts">
      <LineChart title="Altitude" unit="km" times={times} yMin={0} decimals={0} series={[{ label: 'Altitude', values: series('altitude', metresToKm), color: accent }]} />
      <LineChart title="Mach and engine mode" times={times} yMin={0} decimals={1} bands={bands} legend={engineLegend} series={[{ label: 'Mach', values: series('mach'), color: accent }]} />
      <LineChart
        title="Nose wall temperature (hot-wall)"
        unit="°C"
        times={times}
        series={[{ label: 'Nose wall temperature', values: series('wallTemperature', kelvinToCelsius), color: accent }]}
        limit={{ value: kelvinToCelsius(verdict.materialLimit), label: `${verdict.materialName} limit` }}
      />
      <LineChart
        title="Dynamic pressure"
        unit="kPa"
        times={times}
        yMin={0}
        series={[{ label: 'Dynamic pressure q', values: series('dynamicPressure', pascalToKpa), color: accent }]}
        limit={{ value: pascalToKpa(verdict.maxDynamicPressure), label: 'q limit' }}
      />
      <LineChart title="Nose heat flux (Sutton–Graves, cold-wall)" unit="MW/m²" times={times} yMin={0} decimals={2} series={[{ label: 'Heat flux qs', values: series('heatFlux', wattsToMw), color: accent }]} />
    </div>
  )
}

export default ChartsPanel
