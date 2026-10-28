import { playbackSpeeds } from '../lib/usePlayback.js'
import { formatValue } from '../lib/units.js'

function Timeline({ playback, start, end }) {
  const { time, playing, speed, setSpeed, togglePlay, seek } = playback
  return (
    <div className="timeline" role="group" aria-label="Playback">
      <button type="button" className="playButton" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? '❚❚' : '▶'}
      </button>
      <div className="speedButtons" role="radiogroup" aria-label="Playback speed">
        {playbackSpeeds.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            className={`speedButton${speed === s ? ' speedButtonActive' : ''}`}
            onClick={() => setSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
      <input
        className="scrubber"
        type="range"
        min={start}
        max={end}
        step="0.1"
        value={time}
        aria-label="Flight time"
        onChange={(e) => seek(Number(e.target.value))}
      />
      <span className="timelineTime">
        t = {formatValue(time, 0)} s <span className="timelineEnd">/ {formatValue(end, 0)} s</span>
      </span>
    </div>
  )
}

export default Timeline
