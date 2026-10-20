/**
 * Catálogo normativo verificado.
 *
 * Cada valor fue transcrito de la norma oficial y lleva su fuente. Los valores
 * que no son directamente comparables con la variable medida se marcan con
 * `pendingVerification: true` y NO clasifican (se reportan como no aplicables).
 *
 * Normas:
 *  - D.S. N° 004-2017-MINAM (ECA para agua), Anexo, Categorías 3 y 4.
 *  - D.S. N° 003-2010-MINAM (LMP efluentes de PTAR), Anexo.
 *  - D.S. N° 010-2008-PRODUCE (LMP industria de harina y aceite de pescado), Tabla N° 01.
 */

import type { NormativeProfileDefinition } from "./types";

const ECA_SOURCE =
  "D.S. N° 004-2017-MINAM, Anexo, Categoría 4: Conservación del ambiente acuático";
const ECA_D1_SOURCE =
  "D.S. N° 004-2017-MINAM, Anexo, Categoría 3: Riego de vegetales, D1 riego no restringido";
const LMP_PTAR_SOURCE =
  "D.S. N° 003-2010-MINAM, Anexo: LMP para efluentes de PTAR vertidos a cuerpos de agua";
const LMP_PESCA_SOURCE =
  "D.S. N° 010-2008-PRODUCE, Tabla N° 01, columna I (zona de protección ambiental litoral)";

const PARAMETER_LABELS: Record<string, string> = {
  ph: "Potencial de hidrógeno (pH)",
  conductivity: "Conductividad",
  dissolvedOxygen: "Oxígeno disuelto",
  temperature: "Temperatura",
  bod5: "Demanda bioquímica de oxígeno (DBO5)",
  cod: "Demanda química de oxígeno (DQO)",
  totalSuspendedSolids: "Sólidos suspendidos totales (SST)",
  fatsOils: "Aceites y grasas",
  thermotolerantColiforms: "Coliformes termotolerantes",
  nitrates: "Nitratos (NO3-)",
  phosphates: "Fosfatos (PO4)",
};

export function parameterLabel(parameter: string): string {
  return PARAMETER_LABELS[parameter] ?? parameter;
}

export const ECA_E2: NormativeProfileDefinition = {
  id: "eca-e2",
  label: "ECA E2 — Ríos (costa y sierra)",
  instrument: "ECA",
  category: "E2",
  source: ECA_SOURCE,
  limits: [
    { parameter: "ph", unit: "unidad de pH", min: 6.5, max: 9.0, source: ECA_SOURCE },
    { parameter: "bod5", unit: "mg/L", max: 10, source: ECA_SOURCE },
    { parameter: "dissolvedOxygen", unit: "mg/L", min: 5, source: ECA_SOURCE },
    { parameter: "totalSuspendedSolids", unit: "mg/L", max: 100, source: ECA_SOURCE },
    { parameter: "conductivity", unit: "µS/cm", max: 1000, source: ECA_SOURCE },
    { parameter: "thermotolerantColiforms", unit: "NMP/100 mL", max: 2000, source: ECA_SOURCE },
    { parameter: "nitrates", unit: "mg/L", max: 13, source: ECA_SOURCE },
    {
      parameter: "phosphates",
      unit: "mg/L",
      max: 0.05,
      source: ECA_SOURCE,
      note: "El ECA limita fósforo total (0,05 mg/L), no fosfatos (PO4); se reporta como no aplicable hasta contar con fósforo total.",
      pendingVerification: true,
    },
    { parameter: "fatsOils", unit: "mg/L", max: 5, source: ECA_SOURCE },
  ],
};

export const ECA_E3: NormativeProfileDefinition = {
  id: "eca-e3",
  label: "ECA E3 — Ecosistemas costeros y marinos",
  instrument: "ECA",
  category: "E3",
  source: ECA_SOURCE,
  limits: [
    { parameter: "ph", unit: "unidad de pH", min: 6.8, max: 8.5, source: ECA_SOURCE },
    { parameter: "bod5", unit: "mg/L", max: 10, source: ECA_SOURCE },
    { parameter: "dissolvedOxygen", unit: "mg/L", min: 4, source: ECA_SOURCE },
    { parameter: "totalSuspendedSolids", unit: "mg/L", max: 30, source: ECA_SOURCE },
    { parameter: "thermotolerantColiforms", unit: "NMP/100 mL", max: 2000, source: ECA_SOURCE },
    { parameter: "nitrates", unit: "mg/L", max: 200, source: ECA_SOURCE },
    {
      parameter: "phosphates",
      unit: "mg/L",
      max: 0.062,
      source: ECA_SOURCE,
      note: "El ECA limita fósforo total (0,062 mg/L), no fosfatos (PO4); se reporta como no aplicable hasta contar con fósforo total.",
      pendingVerification: true,
    },
    { parameter: "fatsOils", unit: "mg/L", max: 5, source: ECA_SOURCE },
  ],
};

export const ECA_D1: NormativeProfileDefinition = {
  id: "eca-d1",
  label: "ECA D1 — Riego de vegetales (no restringido)",
  instrument: "ECA",
  category: "D1",
  source: ECA_D1_SOURCE,
  limits: [
    { parameter: "ph", unit: "unidad de pH", min: 6.5, max: 8.5, source: ECA_D1_SOURCE },
    { parameter: "bod5", unit: "mg/L", max: 15, source: ECA_D1_SOURCE },
    { parameter: "cod", unit: "mg/L", max: 40, source: ECA_D1_SOURCE },
    { parameter: "dissolvedOxygen", unit: "mg/L", min: 4, source: ECA_D1_SOURCE },
    { parameter: "conductivity", unit: "µS/cm", max: 2500, source: ECA_D1_SOURCE },
    { parameter: "thermotolerantColiforms", unit: "NMP/100 mL", max: 1000, source: ECA_D1_SOURCE },
    { parameter: "nitrates", unit: "mg/L", max: 100, source: ECA_D1_SOURCE },
    { parameter: "fatsOils", unit: "mg/L", max: 5, source: ECA_D1_SOURCE },
  ],
};

export const LMP_PTAR: NormativeProfileDefinition = {
  id: "lmp-ptar",
  label: "LMP — Efluente de PTAR",
  instrument: "LMP",
  profile: "PTAR",
  source: LMP_PTAR_SOURCE,
  limits: [
    { parameter: "ph", unit: "unidad de pH", min: 6.5, max: 8.5, source: LMP_PTAR_SOURCE },
    { parameter: "bod5", unit: "mg/L", max: 100, source: LMP_PTAR_SOURCE },
    { parameter: "cod", unit: "mg/L", max: 200, source: LMP_PTAR_SOURCE },
    { parameter: "totalSuspendedSolids", unit: "mg/L", max: 150, source: LMP_PTAR_SOURCE },
    { parameter: "fatsOils", unit: "mg/L", max: 20, source: LMP_PTAR_SOURCE },
    { parameter: "thermotolerantColiforms", unit: "NMP/100 mL", max: 10000, source: LMP_PTAR_SOURCE },
    { parameter: "temperature", unit: "°C", max: 35, source: LMP_PTAR_SOURCE },
  ],
};

export const LMP_PESCA: NormativeProfileDefinition = {
  id: "lmp-pesca",
  label: "LMP — Efluente de harina y aceite de pescado",
  instrument: "LMP",
  profile: "PESCA",
  source: LMP_PESCA_SOURCE,
  limits: [
    { parameter: "ph", unit: "unidad de pH", min: 6, max: 9, source: LMP_PESCA_SOURCE },
    { parameter: "bod5", unit: "mg/L", max: 60, source: LMP_PESCA_SOURCE },
    { parameter: "totalSuspendedSolids", unit: "mg/L", max: 100, source: LMP_PESCA_SOURCE },
    { parameter: "fatsOils", unit: "mg/L", max: 20, source: LMP_PESCA_SOURCE },
  ],
};

export const NORMATIVE_PROFILES: NormativeProfileDefinition[] = [
  ECA_E2,
  ECA_E3,
  ECA_D1,
  LMP_PTAR,
  LMP_PESCA,
];

export function getProfileById(id: string): NormativeProfileDefinition | undefined {
  return NORMATIVE_PROFILES.find((p) => p.id === id);
}
