// Field validators for the editors: each returns an error message or null.
export const atLeast = (min, unit = '') => (v) => (v < min ? `Must be ≥ ${min}${unit}` : null)
export const greaterThan = (min, unit = '') => (v) => (v <= min ? `Must be > ${min}${unit}` : null)
export const between = (min, max, unit = '') => (v) =>
  v < min || v > max ? `Must be between ${min} and ${max}${unit}` : null

// Combines validators; the first message wins.
export const all = (...validators) => (v) => {
  for (const validator of validators) {
    const message = validator(v)
    if (message) return message
  }
  return null
}
