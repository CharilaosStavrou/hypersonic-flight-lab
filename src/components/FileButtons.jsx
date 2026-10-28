import { useRef } from 'react'
import { sampleFlights } from '../data/sampleFlights.js'

// Header actions: load a sample, start new, export and import JSON.
function FileButtons({ onLoadSample, onNew, onExport, onImportFile }) {
  const fileInput = useRef(null)
  return (
    <div className="headerActions">
      <select
        aria-label="Load sample"
        value=""
        onChange={(e) => {
          if (e.target.value) onLoadSample(e.target.value)
        }}
      >
        <option value="">Load sample…</option>
        {sampleFlights.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button type="button" className="secondaryButton" onClick={onNew}>
        New
      </button>
      <button type="button" className="secondaryButton" onClick={onExport}>
        Export JSON
      </button>
      <button type="button" className="secondaryButton" onClick={() => fileInput.current.click()}>
        Import JSON
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onImportFile(file)
        }}
      />
    </div>
  )
}

export default FileButtons
