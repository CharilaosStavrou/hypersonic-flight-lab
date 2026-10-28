import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { createAircraft } from './aircraftModel.js'
import { surfaceTemperature } from './heatFalloff.js'
import { createAnnotations, createGround, createHumanFigure } from './scaleReference.js'
import { disposeObject } from './sceneObjects.js'
import { temperatureToRgb } from '../lib/heatColor.js'

// True-scale (metres) close-up of the aircraft with its surface heat map.
// Owns all WebGL resources; call dispose() when done.
export class AircraftScene {
  constructor(container) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x05080d)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03 // stay above the ground
    this.controls.minDistance = 2
    this.controls.maxDistance = 400

    this.scene.add(new THREE.HemisphereLight(0xdfe8f5, 0x1a2230, 1.4))
    const sun = new THREE.DirectionalLight(0xffffff, 1.8)
    sun.position.set(30, 60, 40)
    this.scene.add(sun)

    this.content = new THREE.Group()
    this.scene.add(this.content)
    this.aircraft = null
    this.sizeKey = null
    this.temperatures = { nose: 288.15, ambient: 288.15 }

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.renderer.setAnimationLoop(() => {
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    })
  }

  resize() {
    const { clientWidth: width, clientHeight: height } = this.container
    if (width === 0 || height === 0) return
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  // Rebuilds the aircraft, ground and annotations when the dimensions change.
  setVehicle({ length, wingspan, noseRadius }) {
    const sizeKey = [length, wingspan, noseRadius].join()
    if (sizeKey === this.sizeKey) return
    const firstBuild = this.sizeKey === null
    this.sizeKey = sizeKey
    disposeObject(this.content)
    this.content.clear()

    this.aircraft = createAircraft({ length, wingspan, noseRadius })
    const humanPosition = new THREE.Vector3(length / 2 + 2.5, 0, wingspan / 4)
    const human = createHumanFigure()
    human.position.copy(humanPosition)
    const noseTip = new THREE.Vector3(length / 2, this.aircraft.userData.dimensions.gearHeight + 2, 0)
    this.content.add(
      createGround(Math.max(length, wingspan) * 2 + 20),
      this.aircraft,
      human,
      createAnnotations(this.aircraft.userData.dimensions, humanPosition, noseTip),
    )
    this.applyTemperatures()
    if (firstBuild) this.frame(length)
  }

  frame(length) {
    this.controls.target.set(0, 2, 0)
    this.camera.position.set(length * 0.85, length * 0.45, length * 0.95)
    this.controls.update()
  }

  // Colours every vertex: T = T∞ + (Tnose − T∞) × factor (illustrative outside the nose).
  setTemperatures(noseTemperature, ambientTemperature) {
    this.temperatures = { nose: noseTemperature, ambient: ambientTemperature }
    this.applyTemperatures()
  }

  applyTemperatures() {
    if (!this.aircraft) return
    const { nose, ambient } = this.temperatures
    for (const mesh of this.aircraft.userData.heatParts) {
      const { heatFactors } = mesh.geometry.userData
      const colors = mesh.geometry.attributes.color
      for (let i = 0; i < heatFactors.length; i += 1) {
        colors.setXYZ(i, ...temperatureToRgb(surfaceTemperature(nose, ambient, heatFactors[i])))
      }
      colors.needsUpdate = true
    }
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
