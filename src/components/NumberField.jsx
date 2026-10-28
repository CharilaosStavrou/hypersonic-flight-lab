import { useId, useState } from 'react'
import { formatDecimal, parseDecimal } from '../lib/parseDecimal.js'

// Text input for numbers (comma or point as decimal separator).
// Valid input is passed up while typing; invalid input shows a red border
// and a message, and reverts to the last valid value on blur.
// `validate(number)` returns an error message or null.
function NumberField({ label, unit, value, onChange, validate, decimals = 4, compact = false }) {
  const id = useId()
  const [draft, setDraft] = useState(null) // text while focused, null otherwise
  const text = draft ?? formatDecimal(value, decimals)

  const parsed = parseDecimal(text)
  const error =
    draft === null
      ? null
      : Number.isNaN(parsed)
        ? 'Enter a number'
        : (validate?.(parsed) ?? null)

  function handleChange(event) {
    const next = event.target.value
    setDraft(next)
    const number = parseDecimal(next)
    if (!Number.isNaN(number) && !validate?.(number) && number !== value) onChange(number)
  }

  return (
    <div className={`field${compact ? ' fieldCompact' : ''}`}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className={`inputWrap${error ? ' inputInvalid' : ''}`}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={() => setDraft(formatDecimal(value, decimals))}
          onBlur={() => setDraft(null)}
          onChange={handleChange}
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
      {error && (
        <div id={`${id}-error`} className="fieldError" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

export default NumberField
