// Engine mode from Mach number with editable ranges { min, max } (inclusive).
// Listed from low- to high-speed engine; where ranges overlap, the
// higher-speed engine is chosen and `overlap` is set.
export const engineOrder = ['turbojet', 'ramjet', 'scramjet']

export function engineMode(mach, engineRanges) {
  const candidates = engineOrder.filter((name) => {
    const range = engineRanges[name]
    return mach >= range.min && mach <= range.max
  })
  if (candidates.length === 0) return { mode: 'none', overlap: false, candidates }
  // A shared boundary (turbojet max 3 = ramjet min 3) is a handover, not an
  // overlap: only flag when Mach lies strictly inside two or more ranges.
  const strictlyInside = candidates.filter((name) => {
    const range = engineRanges[name]
    return mach > range.min && mach < range.max
  })
  return {
    mode: candidates[candidates.length - 1],
    overlap: strictlyInside.length > 1,
    candidates,
  }
}
