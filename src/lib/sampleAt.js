// Flight state at any time t, linearly interpolated between the 1 s samples.
// Categorical fields (engine mode) come from the sample at or before t.
// Longitude is interpolated the short way across the antimeridian.
export function sampleAt(samples, time) {
  if (time <= samples[0].time) return samples[0]
  const last = samples[samples.length - 1]
  if (time >= last.time) return last
  let low = 0
  let high = samples.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (samples[mid].time <= time) low = mid
    else high = mid
  }
  const a = samples[low]
  const b = samples[high]
  const f = (time - a.time) / (b.time - a.time)
  const state = { ...a, time }
  for (const key of Object.keys(a)) {
    if (key === 'time' || typeof a[key] !== 'number') continue
    state[key] = a[key] + (b[key] - a[key]) * f
  }
  let dLon = b.longitude - a.longitude
  if (dLon > 180) dLon -= 360
  if (dLon < -180) dLon += 360
  let longitude = a.longitude + dLon * f
  if (longitude > 180) longitude -= 360
  if (longitude < -180) longitude += 360
  state.longitude = longitude
  return state
}
