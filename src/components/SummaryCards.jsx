import { formatDuration, formatValue, kelvinToCelsius, metresToKm, pascalToKpa, wattsToMw } from '../lib/units.js'

function Card({ label, value, detail }) {
  return (
    <div className="card">
      <div className="cardLabel">{label}</div>
      <div className="cardValue">{value}</div>
      {detail && <div className="cardDetail">{detail}</div>}
    </div>
  )
}

const at = (peak) => `at t = ${formatValue(peak.time, 0)} s`

function SummaryCards({ result }) {
  const { peaks } = result
  return (
    <div className="cards">
      <Card label="Peak Mach" value={formatValue(peaks.mach.value, 2)} detail={at(peaks.mach)} />
      <Card
        label="Peak nose temperature"
        value={formatValue(kelvinToCelsius(peaks.wallTemperature.value), 0, '°C')}
        detail={`hot-wall, ${at(peaks.wallTemperature)}; cold-wall upper bound ${formatValue(kelvinToCelsius(peaks.coldWallTemperature.value), 0, '°C')}`}
      />
      <Card
        label="Peak stagnation temp. T0"
        value={formatValue(kelvinToCelsius(peaks.stagnationTemperature.value), 0, '°C')}
        detail="ideal-gas upper bound; real-gas effects make the real value lower"
      />
      <Card label="Peak heat flux" value={formatValue(wattsToMw(peaks.heatFlux.value), 2, 'MW/m²')} detail={`nose, ${at(peaks.heatFlux)}`} />
      <Card label="Peak dynamic pressure" value={formatValue(pascalToKpa(peaks.dynamicPressure.value), 1, 'kPa')} detail={at(peaks.dynamicPressure)} />
      <Card label="Flight time" value={formatDuration(result.flightTime)} detail={`${formatValue(result.flightTime, 0)} s`} />
      <Card
        label="Distance"
        value={formatValue(metresToKm(result.distanceFlown), 0, 'km')}
        detail={`of ${formatValue(metresToKm(result.routeDistance), 0, 'km')} route`}
      />
    </div>
  )
}

export default SummaryCards
