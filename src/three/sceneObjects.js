import * as THREE from 'three'
import { latLonToVector } from './geo3d.js'
import { temperatureToRgb } from '../lib/heatColor.js'

// Latitude/longitude grid every 30°, slightly above the surface.
export function createGraticule(radius = 1.0015) {
  const points = []
  const push = (a, b) => points.push(...latLonToVector(a[0], a[1], radius), ...latLonToVector(b[0], b[1], radius))
  for (let lat = -60; lat <= 60; lat += 30) {
    for (let lon = -180; lon < 180; lon += 2) push([lat, lon], [lat, lon + 2])
  }
  for (let lon = -180; lon < 180; lon += 30) {
    for (let lat = -90; lat < 90; lat += 2) push([lat, lon], [lat + 2, lon])
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  const material = new THREE.LineBasicMaterial({ color: 0x7fa3c9, transparent: true, opacity: 0.18 })
  return new THREE.LineSegments(geometry, material)
}

// Atmosphere glow: a slightly larger back-facing shell with a Fresnel falloff.
export function createAtmosphere() {
  const material = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(0x3fb6ff) } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }`,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = 1.0 - abs(dot(vNormal, vView));
        float intensity = pow(rim, 3.0) * 0.9;
        gl_FragColor = vec4(glowColor, intensity);
      }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
  return new THREE.Mesh(new THREE.SphereGeometry(1.06, 64, 32), material)
}

// Tube along the flight path, each ring coloured by the nose temperature.
export function createFlightPath(points, tubeRadius = 0.004) {
  const vectors = points.map((p) => new THREE.Vector3(...p.position))
  const curve = new THREE.CatmullRomCurve3(vectors, false, 'centripetal')
  const segments = Math.max(1, vectors.length - 1)
  const radial = 6
  const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius, radial, false)
  const colors = []
  for (let i = 0; i <= segments; i += 1) {
    const rgb = temperatureToRgb(points[Math.min(i, points.length - 1)].temperature)
    for (let j = 0; j <= radial; j += 1) colors.push(...rgb)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true }))
}

// Text sprite (canvas texture) for start/end labels.
export function createLabel(text, color = '#e3e8f0') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const font = '600 44px Inter, system-ui, sans-serif'
  ctx.font = font
  canvas.width = Math.ceil(ctx.measureText(text).width) + 32
  canvas.height = 64
  ctx.font = font
  ctx.fillStyle = 'rgba(11, 15, 23, 0.75)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 16, 34)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  // Constant on-screen size: scale is a fraction of the viewport height.
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, sizeAttenuation: false }))
  const height = 0.035
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)
  sprite.center.set(0, -0.3)
  return sprite
}

// Round marker on the surface.
export function createMarker(color) {
  return new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), new THREE.MeshBasicMaterial({ color }))
}

// Aircraft marker: a cone whose tip points along +Y (re-oriented per frame).
export function createAircraftMarker() {
  const geometry = new THREE.ConeGeometry(0.012, 0.045, 16)
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xe3e8f0, emissive: 0x3fb6ff, emissiveIntensity: 0.35 }))
}

// Disposes every geometry, material and texture below an object.
export function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose()
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    for (const material of materials) {
      if (!material) continue
      material.map?.dispose()
      material.dispose()
    }
  })
}
