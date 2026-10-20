/**
 * Motor normativo — tipos.
 *
 * Separa el INSTRUMENTO normativo (ECA para el cuerpo de agua, LMP para el
 * efluente) de la categoría o perfil concreto. Un mismo punto de monitoreo
 * puede evaluarse contra ECA-E2 (cauce), ECA-E3 (mar) o LMP (efluente), pero
 * nunca se mezclan resultados de instrumentos distintos en un mismo veredicto.
 */

export type NormativeInstrument = "ECA" | "LMP";

export type EcaCategory = "E2" | "E3" | "D1";

export type LmpProfile = "PTAR" | "PESCA";

export type NormativeProfile =
  | { instrument: "ECA"; category: EcaCategory }
  | { instrument: "LMP"; profile: LmpProfile };

/** Parámetros con límite normativo en los perfiles implementados. */
export type NormativeParameter =
  | "ph"
  | "conductivity"
  | "dissolvedOxygen"
  | "temperature"
  | "bod5"
  | "cod"
  | "totalSuspendedSolids"
  | "fatsOils"
  | "thermotolerantColiforms"
  | "nitrates"
  | "phosphates";

export type ParameterStatus =
  | "compliant"
  | "alert"
  | "non_compliant"
  | "not_measured"
  | "not_applicable";

export interface NormativeLimit {
  parameter: NormativeParameter;
  unit: string;
  /** Límite inferior (inclusive). */
  min?: number;
  /** Límite superior (inclusive). */
  max?: number;
  /** Norma y artículo/tabla de donde proviene el valor. */
  source: string;
  note?: string;
  /**
   * true cuando el valor no pudo verificarse contra la fuente oficial.
   * Un límite pendiente NUNCA clasifica: se reporta como no aplicable.
   */
  pendingVerification?: boolean;
}

export interface NormativeProfileDefinition {
  id: string;
  label: string;
  instrument: NormativeInstrument;
  category?: EcaCategory;
  profile?: LmpProfile;
  source: string;
  limits: NormativeLimit[];
}

export interface ParameterEvaluation {
  parameter: NormativeParameter;
  label: string;
  unit: string;
  value: number | null;
  status: ParameterStatus;
  min?: number;
  max?: number;
  source?: string;
  note?: string;
}

export interface NormativeEvaluation {
  profile: NormativeProfileDefinition;
  status: "compliant" | "alert" | "non_compliant" | "insufficient_data";
  parameters: ParameterEvaluation[];
  violations: ParameterEvaluation[];
  alerts: ParameterEvaluation[];
  evaluatedCount: number;
  notes: string[];
}
