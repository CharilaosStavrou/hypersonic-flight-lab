import * as THREE from 'three'
import { backgroundFactor, bodyFactor, leadingEdgeFactor } from './heatFalloff.js'

// Original generic hypersonic aircraft, built at true scale in metres.
// Frame: nose tip at x = +L/2, tail at x = −L/2, wings along ±z, y up,
// lowest point (wheels) on the ground at y = 0. Axial station a is measured
// from the nose tip (a = L/2 − x).

export function aircraftDimensions({ length, wingspan, noseRadius }) {
  const bodyRadius = Math.max(0.045 * length, 1.3 * noseRadius)
  return {
    length,
    wingspan,
    noseRadius,
    bodyRadius,
    forebodyLength: 0.38 * length,
    wingRootLe: 0.45 * length,
    wingTipLe: 0.87 * length,
    wingTe: 0.95 * length,
    wingThickness: Math.max(0.12, 0.008 * length),
    finRootLe: 0.72 * length,
    finTipLe: 0.88 * length,
    finTe: 0.98 * length,
    finHeight: 0.16 * length,
    ductHeight: 0.7 * bodyRadius,
    gearHeight: 0.05 * length,
  }
}

// Sphere-cone-cylinder-boattail profile as [radius, axial] points from tip to base.
// Nose sphere radius rn is tangent to a cone of half-angle θ:
//   tan θ = (R − rn) ÷ Lf, tangency at a = rn (1 − sin θ), r = rn cos θ
export function bodyProfile(d) {
  const { noseRadius: rn, bodyRadius: R, forebodyLength, length } = d
  const theta = Math.atan((R - rn) / forebodyLength)
  const points = []
  const arcEnd = Math.PI / 2 - theta
  for (let i = 0; i <= 16; i += 1) {
    const phi = (arcEnd * i) / 16
    points.push([rn * Math.sin(phi), rn * (1 - Math.cos(phi))])
  }
  const [rt, at] = points[points.length - 1]
  const coneEnd = at + (R - rt) / Math.tan(theta)
  for (let i = 1; i <= 12; i += 1) {
    const a = at + ((coneEnd - at) * i) / 12
    points.push([rt + (a - at) * Math.tan(theta), a])
  }
  points.push([R, 0.85 * length], [0.7 * R, length], [0, length])
  return points
}

// Body radius at axial station a (linear interpolation of the profile).
export function radiusAt(profile, a) {
  for (let i = 1; i < profile.length; i += 1) {
    const [r1, a1] = profile[i]
    if (a1 >= a) {
      const [r0, a0] = profile[i - 1]
      return a1 === a0 ? r1 : r0 + ((r1 - r0) * (a - a0)) / (a1 - a0)
    }
  }
  return 0
}

function setHeatFactors(geometry, factorAt) {
  const position = geometry.attributes.position
  const factors = new Float32Array(position.count)
  for (let i = 0; i < position.count; i += 1) factors[i] = factorAt(position.getX(i), position.getY(i), position.getZ(i))
  geometry.userData.heatFactors = factors
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(position.count * 3), 3))
}

function heatedMesh(geometry) {
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15 }))
}

function extrudedPlate(outline, thickness) {
  const shape = new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u, v)))
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false })
  geometry.translate(0, 0, -thickness / 2)
  return geometry
}

// Returns a THREE.Group with the heat-coloured parts (userData.heatParts) and the gear.
export function createAircraft(vehicle) {
  const d = aircraftDimensions(vehicle)
  const { length: L, bodyRadius: R } = d
  const toX = (a) => L / 2 - a
  const centreY = d.gearHeight + d.ductHeight + 0.9 * R
  const group = new THREE.Group()
  const heatParts = []

  const profile = bodyProfile(d)
  // Lathe points run from base (y = 0) to tip (y = L) so the normals face outwards.
  const body = new THREE.LatheGeometry(profile.map(([r, a]) => new THREE.Vector2(r, L - a)).reverse(), 48)
  body.translate(0, -L / 2, 0)
  body.rotateZ(-Math.PI / 2)
  setHeatFactors(body, (x) => bodyFactor(L / 2 - x, L))

  const halfSpan = d.wingspan / 2
  const leAt = (span) => d.wingRootLe + ((d.wingTipLe - d.wingRootLe) * span) / halfSpan
  const wing = extrudedPlate(
    [[d.wingRootLe, 0], [d.wingTipLe, halfSpan], [d.wingTe, halfSpan], [d.wingTe, -halfSpan], [d.wingTipLe, -halfSpan]].map(([a, z]) => [toX(a), z]),
    d.wingThickness,
  )
  wing.rotateX(-Math.PI / 2)
  wing.translate(0, -0.3 * R, 0)
  setHeatFactors(wing, (x, y, z) => leadingEdgeFactor(L / 2 - x - leAt(Math.abs(z)), L, 0.35))

  const finBase = 0.65 * R
  const finLeAt = (h) => d.finRootLe + ((d.finTipLe - d.finRootLe) * h) / d.finHeight
  const fin = extrudedPlate(
    [[d.finRootLe, finBase], [d.finTipLe, finBase + d.finHeight], [d.finTe, finBase + d.finHeight], [d.finTe, finBase]].map(([a, y]) => [toX(a), y]),
    d.wingThickness,
  )
  setHeatFactors(fin, (x, y) => leadingEdgeFactor(L / 2 - x - finLeAt(Math.max(0, y - finBase)), L, 0.25))

  const ductLength = 0.42 * L
  const duct = new THREE.BoxGeometry(ductLength, d.ductHeight, 1.3 * R)
  duct.translate(toX(0.62 * L), -0.9 * R - d.ductHeight / 2 + 0.2 * R, 0)
  setHeatFactors(duct, () => backgroundFactor)

  for (const geometry of [body, wing, fin, duct]) {
    geometry.translate(0, centreY, 0)
    const mesh = heatedMesh(geometry)
    heatParts.push(mesh)
    group.add(mesh)
  }

  group.add(createGear(d, centreY, toX, profile))
  group.userData = { heatParts, dimensions: d }
  return group
}

// Simple landing gear (not heat-coloured): nose leg and two main legs.
function createGear(d, centreY, toX, profile) {
  const gear = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: 0x6b7686, roughness: 0.7 })
  const wheelRadius = Math.max(0.25, 0.012 * d.length)
  const legs = [
    [toX(0.22 * d.length), 0, centreY - 0.9 * radiusAt(profile, 0.22 * d.length)],
    [toX(0.7 * d.length), 1.2 * d.bodyRadius, centreY - 0.3 * d.bodyRadius],
    [toX(0.7 * d.length), -1.2 * d.bodyRadius, centreY - 0.3 * d.bodyRadius],
  ]
  for (const [x, z, top] of legs) {
    const legHeight = top - wheelRadius
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, legHeight, 8), material)
    leg.position.set(x, wheelRadius + legHeight / 2, z)
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.25, 20), material)
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(x, wheelRadius, z)
    gear.add(leg, wheel)
  }
  return gear
}
