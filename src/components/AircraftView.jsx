import { useEffect, useRef } from 'react'
import HeatLegend from './HeatLegend.jsx'
import { AircraftScene } from '../three/AircraftScene.js'
import { formatValue, kelvinToCelsius } from '../lib/units.js'

// True-scale aircraft close-up with the surface heat map. Loaded lazily.
function AircraftView({ result, vehicle }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const { length, wingspan, noseRadius } = vehicle

  // Until the timeline exists, the heat map shows the moment of peak nose temperature.
  const peak = result.peaks.wallTemperature
  const sample = result.samples.find((s) => s.time === peak.time)

  useEffect(() => {
    const scene = new AircraftScene(containerRef.current)
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current.setVehicle({ length, wingspan, noseRadius })
  }, [length, wingspan, noseRadius])

  useEffect(() => {
    sceneRef.current.setTemperatures(sample.wallTemperature, sample.temperature)
  }, [sample])

  return (
    <div className="view3d">
      <div ref={containerRef} className="viewCanvas" />
      <div className="viewOverlay viewControls">
        <div className="sliderLabel">
          Nose: {formatValue(kelvinToCelsius(sample.wallTemperature), 0, '°C')}{' '}
          <span className="visualOnly">physics-based</span>
        </div>
        <div className="hint">
          Hot-wall stagnation-point value at t = {formatValue(sample.time, 0)} s (peak). Leading edges and the rest of
          the surface use an illustrative falloff from the nose value, not computed heating.
        </div>
      </div>
      <div className="viewOverlay viewLegend">
        <HeatLegend
          title="Surface temperature (nose physics-based, rest illustrative)"
          limit={{ temperature: result.verdict.materialLimit, label: `${result.verdict.materialName} limit` }}
        />
      </div>
      <div className="viewOverlay viewHint">True scale · grid 1 m and 10 m · drag to rotate · scroll to zoom · right-drag to pan</div>
    </div>
  )
}

export default AircraftView
