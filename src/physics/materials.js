// Material check: the nose wall temperature must not exceed the material's
// maximum service temperature (K).

export function findMaterial(materials, materialId) {
  return materials.find((material) => material.id === materialId) ?? null
}

export function exceedsMaterialLimit(wallTemperature, material) {
  return wallTemperature > material.maxServiceTemperature
}
