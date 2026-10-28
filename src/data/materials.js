// Approximate maximum service temperatures from the literature, in kelvin.
// Values vary by source, temper, exposure time and loading.
export const defaultMaterials = [
  {
    id: 'aluminium2024',
    name: 'Aluminium alloy 2024',
    maxServiceTemperature: 423.15, // ≈ 150 °C; strength drops quickly above this
    note: 'Approx. 120–175 °C depending on temper and exposure time',
  },
  {
    id: 'ti6al4v',
    name: 'Titanium alloy Ti-6Al-4V',
    maxServiceTemperature: 673.15, // ≈ 400 °C long-term
    note: 'Approx. 350–450 °C long-term; higher only for short exposure',
  },
  {
    id: 'inconel718',
    name: 'Nickel superalloy Inconel 718',
    maxServiceTemperature: 923.15, // ≈ 650 °C
    note: 'Approx. 650–700 °C for structural strength',
  },
  {
    id: 'carbonCarbon',
    name: 'Carbon-carbon composite',
    maxServiceTemperature: 1923.15, // ≈ 1650 °C
    note: 'Approx. 1650 °C with an oxidation-protective coating (e.g. SiC); uncoated it oxidises in air from about 400–500 °C',
  },
]
