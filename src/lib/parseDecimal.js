// Parses a user-typed number. Accepts a comma or a point as decimal separator
// and optional exponent ("1,5", "2.75", "1e-3"). Returns NaN for anything else.
const decimalPattern = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i

export function parseDecimal(text) {
  const normalised = String(text).trim().replace(',', '.')
  if (!decimalPattern.test(normalised)) return Number.NaN
  return Number(normalised)
}

// Formats a number for an input field: up to `maxDecimals` decimals, no
// trailing zeros.
export function formatDecimal(value, maxDecimals = 4) {
  if (!Number.isFinite(value)) return ''
  return String(Number(value.toFixed(maxDecimals)))
}
