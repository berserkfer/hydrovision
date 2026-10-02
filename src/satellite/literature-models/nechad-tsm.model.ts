import type { LiteratureModelDefinition } from "./literature-model.types";

/**
 * Nechad, B., Ruddick, K.G., & Park, Y. (2010). Calibration and validation of a generic
 * multisensor algorithm for mapping of total suspended matter in turbid waters.
 * Remote Sensing of Environment, 114(4), 854–866. https://doi.org/10.1016/j.rse.2009.11.022
 *
 * Fuente primaria verificada (PDF leído completo, no resumen de búsqueda). Ecuación (14) del
 * artículo, coeficientes de Table 5 — banda MERIS 665 nm (equivalente en longitud de onda a
 * Sentinel-2 B04/665 nm, banda roja):
 *
 *   S = Aρ · ρw / (1 − ρw/Cρ) + Bρ   [g/m³ ≡ mg/L]
 *
 *   Aρ = 352.61 g/m³, Bρ = 1.74 g/m³, Cρ = 0.1728 (adimensional, Table 2), R²ρ = 78.9%
 *
 * ρw es la reflectancia "water-leaving" (ρw = π·Rrs, Ec. 1 del artículo) — equivalente a la
 * reflectancia de superficie (BOA) que ya extraemos de Sentinel-2 L2A banda B04 en esta
 * plataforma (misma convención física, sin factor de conversión adicional).
 *
 * Calibrado con 72 pares reflectancia-TSM del Mar del Norte (Bélgica, 2001-2006), validado
 * con 29 pares independientes; TSM 1.24–110.27 mg/L. Diseñado explícitamente como algoritmo
 * GENÉRICO "para cualquier sensor de color oceánico" (MERIS/MODIS/SeaWiFS) — pero su
 * transferibilidad a un dren agrícola de Lambayeque NO ha sido validada por sus autores ni
 * por HydroVision. Se expone solo como referencia bibliográfica externa, nunca como
 * calibración local.
 */

const A_RHO = 352.61; // g/m3
const B_RHO = 1.74; // g/m3
const C_RHO = 0.1728; // adimensional — límite asintótico del modelo

function nechadTsm(reflectance: number): number | null {
  if (!Number.isFinite(reflectance) || reflectance <= 0) return null;
  // Cerca o por encima de Cρ el modelo satura (denominador → 0 o negativo) — fuera de su
  // régimen válido; no se extrapola.
  if (reflectance >= C_RHO * 0.95) return null;
  const value = (A_RHO * reflectance) / (1 - reflectance / C_RHO) + B_RHO;
  if (!Number.isFinite(value) || value < 0) return null;
  return Number(value.toFixed(3));
}

export const NECHAD_TSM_RED_MODEL: LiteratureModelDefinition = {
  code: "NECHAD_2010_TSM_RED_665NM",
  parameterCode: "total_suspended_solids",
  name: "Nechad et al. (2010) — algoritmo banda roja (665 nm) para materia en suspensión",
  requiredBand: "B04",
  unit: "mg/L",
  citation: {
    authors: "Nechad, B., Ruddick, K. G., & Park, Y.",
    year: 2010,
    title:
      "Calibration and validation of a generic multisensor algorithm for mapping of total suspended matter in turbid waters",
    journal: "Remote Sensing of Environment",
    volume: "114(4)",
    pages: "854–866",
    doi: "10.1016/j.rse.2009.11.022",
  },
  calibrationContext:
    "Calibrado con 72 pares reflectancia-TSM medidos en el Mar del Norte (agua costera turbia, Bélgica, 2001–2006); validado con 29 pares independientes adicionales.",
  transferabilityWarning:
    "Modelo NO calibrado con datos de Dren 4000 ni de ningún dren agrícola — es un algoritmo genérico diseñado para transferibilidad entre sensores de color oceánico, pero su aplicabilidad a un canal de drenaje agrícola de Lambayeque no ha sido validada localmente. Trátese como referencia ilustrativa, no como medición ni como calibración propia de esta plataforma.",
  formulaDescription:
    "SST (mg/L) = Aρ·ρw / (1 − ρw/Cρ) + Bρ, con Aρ=352.61, Bρ=1.74, Cρ=0.1728 (banda roja ~665 nm ≈ Sentinel-2 B04), donde ρw es la reflectancia de superficie en banda roja.",
  calibrationMetrics: {
    r2: 0.789,
    n: 72,
    calibratedRangeDescription: "1.24–110.27 mg/L (mediana ≈20.5 mg/L) en agua costera turbia",
  },
  compute: nechadTsm,
};
