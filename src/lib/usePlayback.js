import { useEffect, useRef, useState } from 'react'

export const playbackSpeeds = [1, 10, 60]

// Shared flight timeline: time (s), play/pause and speed (simulated seconds
// per real second). The returned time is always clamped to [start, end].
export function usePlayback(start, end) {
  const [rawTime, setRawTime] = useState(end)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(10)
  // Playback position, written only by event handlers and animation frames.
  const position = useRef(end)
  const time = Math.min(end, Math.max(start, rawTime))

  useEffect(() => {
    if (!playing) return undefined
    let frame
    let previous = performance.now()
    const tick = (now) => {
      const dt = (now - previous) / 1000
      previous = now
      position.current = Math.min(end, Math.max(start, position.current) + dt * speed)
      setRawTime(position.current)
      if (position.current >= end) setPlaying(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed, start, end])

  function seek(t) {
    position.current = t
    setRawTime(t)
  }

  function togglePlay() {
    if (!playing) {
      // Playing from the end restarts the flight.
      seek(time >= end ? start : time)
    }
    setPlaying(!playing)
  }

  return { time, playing, speed, setSpeed, togglePlay, seek }
}
