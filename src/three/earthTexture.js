import * as THREE from 'three'
import { feature } from 'topojson-client'
import land50m from 'world-atlas/land-50m.json'
import { project, unwrapRing } from './mapProjection.js'

const oceanColor = '#0b1a2e'
const landColor = '#34506f'
const coastColor = '#86aad3'

// Land/ocean texture in equirectangular projection, drawn from Natural Earth
// 1:50m land polygons (world-atlas, public domain).
export function createEarthTexture(width = 4096) {
  const height = width / 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = oceanColor
  ctx.fillRect(0, 0, width, height)

  const land = feature(land50m, land50m.objects.land)
  const polygons = land.features.flatMap((f) =>
    f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates,
  )
  const rings = polygons.map((polygon) => polygon.map(unwrapRing))

  // Each polygon (outer ring + holes) is drawn at −360°, 0 and +360° so parts
  // beyond the antimeridian appear on the other side of the map.
  for (const offset of [-360, 0, 360]) {
    for (const polygon of rings) {
      ctx.beginPath()
      for (const ring of polygon) {
        ring.forEach(([lon, lat], i) => {
          const [x, y] = project([lon + offset, lat], width, height)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.closePath()
      }
      ctx.fillStyle = landColor
      ctx.fill('evenodd')
      ctx.strokeStyle = coastColor
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}
