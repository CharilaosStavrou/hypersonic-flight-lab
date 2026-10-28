import { useEffect, useRef } from 'react'
import HeatLegend from './HeatLegend.jsx'
import { AircraftScene } from '../three/AircraftScene.js'
import { formatValue, kelvinToCelsius } from '../lib/units.js'

// True-scale aircraft close-up with the surface heat map. Loaded lazily.
function AircraftView({ result, vehicle, state }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const { length, wingspan, noseRadius } = vehicle

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
    sceneRef.current.setTemperatures(state.wallTemperature, state.temperature)
  }, [state.wallTemperature, state.temperature])

  return (
    <div className="view3d">
      <div ref={containerRef} className="viewCanvas" />
      <div className="viewOverlay viewControls">
        <div className="sliderLabel">
          Nose: {formatValue(kelvinToCelsius(state.wallTemperature), 0, '°C')}{' '}
          <span className="visualOnly">physics-based</span>
        </div>
        <div className="hint">
          Hot-wall stagnation-point value at t = {formatValue(state.time, 0)} s. Leading edges and the rest of
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
