import { describe, expect, it } from 'vitest'
import { interpolateProfile } from './profile.js'

const keyframes = [
  { time: 0, altitude: 0, mach: 0 },
  { time: 100, altitude: 10000, mach: 2 },
  { time: 300, altitude: 30000, mach: 10 },
]

describe('interpolateProfile', () => {
  it('returns keyframe values exactly at keyframe times', () => {
    expect(interpolateProfile(keyframes, 100)).toEqual({ altitude: 10000, mach: 2 })
    expect(interpolateProfile(keyframes, 300)).toEqual({ altitude: 30000, mach: 10 })
  })

  it('interpolates linearly between keyframes', () => {
    // t = 50: halfway through 0–100 s → 5000 m, Mach 1
    expect(interpolateProfile(keyframes, 50)).toEqual({ altitude: 5000, mach: 1 })
    // t = 250: 150/200 = 0.75 of 100–300 s → 10000 + 0.75 × 20000 = 25000 m, 2 + 0.75 × 8 = Mach 8
    const state = interpolateProfile(keyframes, 250)
    expect(state.altitude).toBeCloseTo(25000, 9)
    expect(state.mach).toBeCloseTo(8, 9)
  })

  it('holds the first and last keyframe outside the profile', () => {
    expect(interpolateProfile(keyframes, -10)).toEqual({ altitude: 0, mach: 0 })
    expect(interpolateProfile(keyframes, 999)).toEqual({ altitude: 30000, mach: 10 })
  })
})
