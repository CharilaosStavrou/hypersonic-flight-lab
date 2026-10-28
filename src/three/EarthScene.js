import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createEarthTexture } from './earthTexture.js'
import { flightPathPoints, latLonToVector, sceneRadius } from './geo3d.js'
import { sampleAt } from '../lib/sampleAt.js'
import {
  createAircraftMarker,
  createAtmosphere,
  createFlightPath,
  createGraticule,
  createLabel,
  createMarker,
  disposeObject,
} from './sceneObjects.js'

const up = new THREE.Vector3(0, 1, 0)

// Interactive Earth with the flight path. Owns all WebGL resources; call
// dispose() when done. Earth radius = 1 scene unit.
export class EarthScene {
  constructor(container) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x05080d)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100)
    this.camera.position.set(0, 0, 3.4)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.minDistance = 1.15
    this.controls.maxDistance = 8

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6)
    sun.position.set(5, 3, 5)
    this.scene.add(sun)

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 64),
      new THREE.MeshStandardMaterial({ map: createEarthTexture(), roughness: 1, metalness: 0 }),
    )
    this.scene.add(earth, createGraticule(), createAtmosphere())

    this.flightGroup = new THREE.Group()
    this.scene.add(this.flightGroup)
    this.aircraft = createAircraftMarker()
    this.scene.add(this.aircraft)

    this.follow = false
    this.routeKey = null
    this.samples = []
    this.exaggeration = 50
    this.time = 0

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.renderer.setAnimationLoop(() => this.render())
  }

  resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (width === 0 || height === 0) return
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  // Rebuilds the path, markers and labels for a simulation result.
  setFlight(result, route, exaggeration) {
    const routeKey = [route.startLat, route.startLon, route.endLat, route.endLon].join()
    const isNewRoute = routeKey !== this.routeKey
    this.routeKey = routeKey
    this.samples = result.samples
    this.exaggeration = exaggeration
    disposeObject(this.flightGroup)
    this.flightGroup.clear()

    this.flightGroup.add(createFlightPath(flightPathPoints(result.samples, exaggeration)))
    for (const [label, lat, lon, color] of [
      ['Start', route.startLat, route.startLon, 0xe3e8f0],
      ['End', route.endLat, route.endLon, 0x3fb6ff],
    ]) {
      const position = new THREE.Vector3(...latLonToVector(lat, lon, 1.002))
      const marker = createMarker(color)
      marker.position.copy(position)
      const text = createLabel(label, { alwaysOnTop: true })
      text.position.copy(position)
      text.userData.surfacePoint = position
      this.flightGroup.add(marker, text)
    }
    this.setTime(this.time)
    if (isNewRoute) this.lookAtRoute(route)
  }

  // Points the camera at the middle of the route.
  lookAtRoute(route) {
    const a = new THREE.Vector3(...latLonToVector(route.startLat, route.startLon))
    const b = new THREE.Vector3(...latLonToVector(route.endLat, route.endLon))
    const middle = a.add(b).normalize()
    if (middle.lengthSq() === 0) return
    this.camera.position.copy(middle.multiplyScalar(this.camera.position.length()))
    this.controls.update()
  }

  // Places the aircraft at time t (interpolated, clamped to the flight),
  // oriented along the path between t − 1 s and t + 1 s.
  setTime(time) {
    this.time = time
    if (this.samples.length === 0) return
    const positionAt = (t) => {
      const s = sampleAt(this.samples, t)
      return new THREE.Vector3(...latLonToVector(s.latitude, s.longitude, sceneRadius(s.altitude, this.exaggeration)))
    }
    const current = positionAt(time)
    const direction = positionAt(time + 1).sub(positionAt(time - 1))
    // At rest (no movement) point the cone along the local vertical.
    if (direction.lengthSq() < 1e-14) direction.copy(current).normalize()
    this.aircraft.position.copy(current)
    this.aircraft.quaternion.setFromUnitVectors(up, direction.normalize())
  }

  setFollow(follow) {
    this.follow = follow
    // Distances are measured from the orbit target: the aircraft when
    // following, the Earth's centre otherwise.
    this.controls.minDistance = follow ? 0.05 : 1.15
    if (follow) {
      const offset = this.camera.position.clone().sub(this.controls.target).setLength(0.6)
      this.controls.target.copy(this.aircraft.position)
      this.camera.position.copy(this.aircraft.position).add(offset)
    } else {
      this.controls.target.set(0, 0, 0)
      this.camera.position.setLength(3.4)
    }
    this.controls.update()
  }

  render() {
    if (this.follow) {
      // Keep the camera at the same offset from the aircraft while orbiting.
      const offset = this.camera.position.clone().sub(this.controls.target)
      this.controls.target.copy(this.aircraft.position)
      this.camera.position.copy(this.aircraft.position).add(offset)
    }
    this.controls.update()
    // Labels are drawn on top of the path, so hide each one while its point
    // is behind the globe: a surface point p is visible when p · camera > 1.
    for (const child of this.flightGroup.children) {
      const point = child.userData.surfacePoint
      if (point) child.visible = point.dot(this.camera.position) > 1
    }
    // Keep the aircraft marker at a roughly constant on-screen size.
    const distance = this.camera.position.distanceTo(this.aircraft.position)
    this.aircraft.scale.setScalar(Math.min(1.5, Math.max(0.02, distance / 1.2)))
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.controls.dispose()
    disposeObject(this.scene)
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }
}
