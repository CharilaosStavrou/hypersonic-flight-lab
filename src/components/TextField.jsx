import { useId, useState } from 'react'

// Required text input: an empty value shows a red border and a message and
// reverts to the last valid value on blur.
function TextField({ label, value, onChange }) {
  const id = useId()
  const [draft, setDraft] = useState(null)
  const text = draft ?? value
  const error = text.trim() === '' ? 'Required' : null

  function handleChange(event) {
    setDraft(event.target.value)
    if (event.target.value.trim() !== '') onChange(event.target.value)
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`inputWrap${error ? ' inputInvalid' : ''}`}>
        <input
          id={id}
          type="text"
          value={text}
          aria-invalid={Boolean(error)}
          onFocus={() => setDraft(value)}
          onBlur={() => setDraft(null)}
          onChange={handleChange}
        />
      </div>
      {error && (
        <div className="fieldError" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

export default TextField
