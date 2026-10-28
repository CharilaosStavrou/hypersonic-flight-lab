// Nose stagnation-point heating.

export const stefanBoltzmann = 5.670374e-8 // σ, W/(m²·K⁴)
export const suttonGravesConstant = 1.7415e-4 // k for air, SI (qs in W/m², ρ in kg/m³, rn in m, v in m/s)

// Sutton–Graves stagnation-point convective heat flux: qs = k × √(ρ ÷ rn) × v³
// This is a COLD-WALL flux: it assumes the wall is far colder than the gas.
export function suttonGravesHeatFlux(density, velocity, noseRadius) {
  return suttonGravesConstant * Math.sqrt(density / noseRadius) * velocity ** 3
}

// Cold-wall radiative-equilibrium temperature: Tw = (qs ÷ (ε × σ))^(1/4)
// Conservative upper bound: it radiates away the full cold-wall flux.
export function coldWallTemperature(heatFlux, emissivity) {
  return Math.pow(heatFlux / (emissivity * stefanBoltzmann), 0.25)
}

// Hot-wall radiative-equilibrium temperature. Solves
//   ε × σ × Tw⁴ = qs × (1 − Tw ÷ T0)
// by bisection between the ambient temperature T∞ and the stagnation
// temperature T0.
//
// Why: convective heating is driven by the difference between the gas
// recovery temperature and the wall temperature, so the real flux into a hot
// wall is smaller than the cold-wall Sutton–Graves value. The factor
// (1 − Tw ÷ T0) (wall-to-stagnation enthalpy ratio for a calorically perfect
// gas) removes the flux as Tw approaches T0. Without it, the cold-wall Tw
// exceeds T0 at low Mach (e.g. 711 K at Mach 0.8 at sea level, where T0 is
// 325 K), which is physically impossible. With it, Tw always stays below T0.
//
// If the balance would settle below T∞ (low speed, where radiation from the
// surroundings, ignored here, dominates), the result is T∞.
export function hotWallTemperature(heatFlux, emissivity, stagnationTemp, ambientTemp) {
  if (heatFlux <= 0 || stagnationTemp <= ambientTemp) return ambientTemp
  const residual = (tw) =>
    emissivity * stefanBoltzmann * tw ** 4 - heatFlux * (1 - tw / stagnationTemp)
  // residual rises monotonically with Tw and is > 0 at T0, so a root exists
  // in [T∞, T0] exactly when residual(T∞) < 0.
  if (residual(ambientTemp) >= 0) return ambientTemp
  let low = ambientTemp
  let high = stagnationTemp
  for (let i = 0; i < 100 && high - low > 1e-9; i += 1) {
    const mid = (low + high) / 2
    if (residual(mid) > 0) high = mid
    else low = mid
  }
  return (low + high) / 2
}
