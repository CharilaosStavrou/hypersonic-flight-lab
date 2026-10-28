import * as THREE from 'three'
import { createLabel } from './sceneObjects.js'

const lineColor = 0xc9d4e3

// Ground with a 1 m grid and a brighter 10 m grid, centred on the origin.
export function createGround(extent) {
  const size = Math.ceil(extent / 10) * 10
  const group = new THREE.Group()
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ color: 0x0d131d, roughness: 1 }),
  )
  plane.rotation.x = -Math.PI / 2
  const fine = new THREE.GridHelper(size, size, 0x1c2738, 0x1c2738)
  fine.position.y = 0.002
  const coarse = new THREE.GridHelper(size, size / 10, 0x3a4d68, 0x3a4d68)
  coarse.position.y = 0.004
  group.add(plane, fine, coarse)
  return group
}

// 1.8 m human figure: legs + torso capsule (0–1.58 m) and head (top at 1.8 m).
export function createHumanFigure() {
  const material = new THREE.MeshStandardMaterial({ color: 0xd8dee8, roughness: 0.8 })
  const human = new THREE.Group()
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 1.2, 6, 12), material)
  body.position.y = 0.79 // capsule spans 0 to 1.58 m
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), material)
  head.position.y = 1.69 // top at 1.80 m
  human.add(body, head)
  return human
}

// Dimension line between two points on the ground with end ticks and a label.
function dimensionLine(from, to, tickDirection, text) {
  const group = new THREE.Group()
  const tick = tickDirection.clone().multiplyScalar(0.6)
  const points = [from, to, from.clone().sub(tick), from.clone().add(tick), to.clone().sub(tick), to.clone().add(tick)]
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: lineColor })))
  const label = createLabel(text, { height: 0.03, alwaysOnTop: true })
  label.position.copy(from).add(to).multiplyScalar(0.5)
  label.center.set(0.5, -0.2)
  group.add(label)
  return group
}

// Length and wingspan dimension lines plus labels for the nose radius and the human.
export function createAnnotations(dimensions, humanPosition, noseTip) {
  const { length: L, wingspan: b, noseRadius } = dimensions
  const y = 0.02
  const group = new THREE.Group()
  group.add(
    dimensionLine(new THREE.Vector3(-L / 2, y, -b / 2 - 3), new THREE.Vector3(L / 2, y, -b / 2 - 3), new THREE.Vector3(0, 0, 1), `Length ${L.toFixed(1)} m`),
    dimensionLine(new THREE.Vector3(-L / 2 - 3, y, -b / 2), new THREE.Vector3(-L / 2 - 3, y, b / 2), new THREE.Vector3(1, 0, 0), `Wingspan ${b.toFixed(1)} m`),
  )
  const noseLabel = createLabel(`Nose radius ${noseRadius.toFixed(2)} m`, { height: 0.03, alwaysOnTop: true })
  noseLabel.position.copy(noseTip).add(new THREE.Vector3(0, 1.5, 0))
  noseLabel.center.set(0.5, -0.2)
  const humanLabel = createLabel('Human 1.8 m', { height: 0.03, alwaysOnTop: true })
  humanLabel.position.copy(humanPosition).add(new THREE.Vector3(0, 2.2, 0))
  humanLabel.center.set(0.5, -0.2)
  group.add(noseLabel, humanLabel)
  return group
}
