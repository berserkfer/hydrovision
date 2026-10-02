import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { Sentinel2ReflectanceMap } from "../catalog/sentinel2-bands.catalog";
import type { LiteratureModelDefinition, LiteratureModelEstimate } from "./literature-model.types";
import { NECHAD_TSM_RED_MODEL } from "./nechad-tsm.model";

export const LITERATURE_MODEL_DISCLAIMER =
  "Estimación por modelo de referencia bibliográfica (ecuación publicada y citada) — NO calibrado con datos locales de Dren 4000. Se muestra como referencia externa, no como medición ni como calibración exploratoria propia de esta plataforma. La calibración local sigue mostrándose por separado con su N real.";

/**
 * Registro deliberadamente conservador: solo se agrega un parámetro cuando existe una
 * ecuación de una fuente primaria verificada (ver comentario en cada *.model.ts). Un
 * parámetro sin modelo aquí simplemente no tiene fallback bibliográfico — mantiene el
 * estado honesto de "insuficiente" en vez de fabricar uno.
 */
const REGISTRY: Partial<Record<ParametroCodigoDb, LiteratureModelDefinition>> = {
  total_suspended_solids: NECHAD_TSM_RED_MODEL,
};

export function getLiteratureModel(parameterCode: ParametroCodigoDb): LiteratureModelDefinition | null {
  return REGISTRY[parameterCode] ?? null;
}

export function applyLiteratureModel(
  parameterCode: ParametroCodigoDb,
  reflectances: Sentinel2ReflectanceMap | undefined
): LiteratureModelEstimate | null {
  const model = getLiteratureModel(parameterCode);
  if (!model || !reflectances) return null;

  const reflectance = reflectances[model.requiredBand];
  if (reflectance === undefined || reflectance === null) return null;

  const predictedValue = model.compute(reflectance);
  if (predictedValue === null) return null;

  return {
    modelCode: model.code,
    parameterCode,
    predictedValue,
    unit: model.unit,
    inputBand: model.requiredBand,
    inputReflectance: reflectance,
    citation: model.citation,
    calibrationContext: model.calibrationContext,
    transferabilityWarning: model.transferabilityWarning,
    formulaDescription: model.formulaDescription,
    calibrationMetrics: model.calibrationMetrics,
    disclaimer: LITERATURE_MODEL_DISCLAIMER,
  };
}
