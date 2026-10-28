import { useEffect, useRef, useState } from 'react'
import HeatLegend from './HeatLegend.jsx'
import { EarthScene } from '../three/EarthScene.js'

// 3D Earth with the flight path. Loaded lazily (Three.js and the map data
// are in a separate chunk).
function EarthView({ result, route, time }) {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const [exaggeration, setExaggeration] = useState(50)
  const [follow, setFollow] = useState(false)

  useEffect(() => {
    const scene = new EarthScene(containerRef.current)
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current.setFlight(result, route, exaggeration)
  }, [result, route, exaggeration])

  useEffect(() => {
    sceneRef.current.setTime(time)
  }, [time, result, exaggeration])

  useEffect(() => {
    sceneRef.current.setFollow(follow)
  }, [follow])

  return (
    <div className="view3d">
      <div ref={containerRef} className="viewCanvas" />
      <div className="viewOverlay viewControls">
        <label className="sliderLabel" htmlFor="exaggeration">
          Altitude exaggeration ×{exaggeration} <span className="visualOnly">visual only</span>
        </label>
        <input
          id="exaggeration"
          type="range"
          min="1"
          max="200"
          step="1"
          value={exaggeration}
          onChange={(e) => setExaggeration(Number(e.target.value))}
        />
        <label className="checkboxLabel">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
          Follow aircraft
        </label>
      </div>
      <div className="viewOverlay viewLegend">
        <HeatLegend limit={{ temperature: result.verdict.materialLimit, label: `${result.verdict.materialName} limit` }} />
      </div>
      <div className="viewOverlay viewHint">Drag to rotate · scroll to zoom</div>
    </div>
  )
}

export default EarthView
