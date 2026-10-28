// Flight profile: keyframes { time (s), altitude (m), mach }, linearly
// interpolated in time. Keyframes must be sorted by strictly increasing time
// (see validateModel). Before the first / after the last keyframe the
// nearest keyframe is held.

// Linear interpolation: x = x0 + (x1 − x0) × (t − t0) ÷ (t1 − t0)
export function interpolateProfile(keyframes, time) {
  const first = keyframes[0]
  const last = keyframes[keyframes.length - 1]
  if (time <= first.time) return { altitude: first.altitude, mach: first.mach }
  if (time >= last.time) return { altitude: last.altitude, mach: last.mach }
  let i = 1
  while (keyframes[i].time < time) i += 1
  const a = keyframes[i - 1]
  const b = keyframes[i]
  const fraction = (time - a.time) / (b.time - a.time)
  return {
    altitude: a.altitude + (b.altitude - a.altitude) * fraction,
    mach: a.mach + (b.mach - a.mach) * fraction,
  }
}
