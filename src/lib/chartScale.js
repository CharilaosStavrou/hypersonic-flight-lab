// Linear scale: maps [d0, d1] to [r0, r1].
export function linearScale([d0, d1], [r0, r1]) {
  const span = d1 - d0 || 1
  return (value) => r0 + ((value - d0) / span) * (r1 - r0)
}

// "Nice" axis ticks (steps of 1, 2, 2.5 or 5 × 10ⁿ) covering [min, max].
export function niceTicks(min, max, targetCount = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ticks: [0, 1], min: 0, max: 1 }
  if (max - min < 1e-12) {
    const pad = Math.abs(max) > 0 ? Math.abs(max) * 0.1 : 1
    return niceTicks(min - pad, max + pad, targetCount)
  }
  const rawStep = (max - min) / targetCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((f) => f * magnitude).find((s) => s >= rawStep)
  const niceMin = Math.floor(min / step + 1e-9) * step
  const niceMax = Math.ceil(max / step - 1e-9) * step
  const ticks = []
  for (let v = niceMin; v <= niceMax + step * 1e-6; v += step) ticks.push(Number(v.toPrecision(12)))
  return { ticks, min: niceMin, max: niceMax }
}

// Contiguous runs of the same category, e.g. engine-mode bands:
// [{ value, start, end }] where start/end are x values.
export function categoryRuns(xs, categories) {
  const runs = []
  categories.forEach((value, i) => {
    const last = runs[runs.length - 1]
    if (last && last.value === value) last.end = xs[i]
    else {
      if (last) last.end = xs[i]
      runs.push({ value, start: xs[i], end: xs[i] })
    }
  })
  return runs
}
