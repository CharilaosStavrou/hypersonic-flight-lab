// Equirectangular projection helpers for the Earth texture (no Three.js).

// Pixel position: x = (λ + 180) ÷ 360 × width, y = (90 − φ) ÷ 180 × height
export function project([lon, lat], width, height) {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height]
}

// Makes a ring's longitudes continuous (no jumps > 180° across the
// antimeridian). A ring that winds once around a pole (Antarctica) is closed
// through that pole so it fills the right side. The caller draws the result
// at longitude offsets −360°, 0 and +360°.
export function unwrapRing(ring) {
  if (ring.length === 0) return []
  const out = [[ring[0][0], ring[0][1]]]
  for (let i = 1; i < ring.length; i += 1) {
    const previous = out[i - 1][0]
    let lon = ring[i][0]
    while (lon - previous > 180) lon -= 360
    while (lon - previous < -180) lon += 360
    out.push([lon, ring[i][1]])
  }
  const winding = out[out.length - 1][0] - out[0][0]
  if (Math.abs(winding) > 180) {
    const meanLat = out.reduce((sum, p) => sum + p[1], 0) / out.length
    const pole = meanLat < 0 ? -90 : 90
    out.push([out[out.length - 1][0], pole], [out[0][0], pole])
  }
  return out
}
