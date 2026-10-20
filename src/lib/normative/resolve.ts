/**
 * Resolución de perfil normativo según el tipo de punto de monitoreo.
 *
 * El tipo de punto es una decisión metodológica de la tesis: un efluente se
 * evalúa contra LMP; el cauce contra ECA-E2 (o D1 si se documenta reúso para
 * riego); la zona marina contra ECA-E3.
 */

import { ECA_D1, ECA_E2, ECA_E3, LMP_PESCA, LMP_PTAR } from "./catalog";
import type { NormativeProfileDefinition } from "./types";

export type MonitoringPointType =
  | "efluente_ptar"
  | "efluente_pesca"
  | "cauce"
  | "mar";

export const POINT_TYPE_LABELS: Record<MonitoringPointType, string> = {
  efluente_ptar: "Efluente de PTAR / laguna de oxidación",
  efluente_pesca: "Efluente de procesamiento pesquero",
  cauce: "Cauce del dren (cuerpo de agua)",
  mar: "Zona marina / desembocadura",
};

const DEFAULTS: Record<MonitoringPointType, NormativeProfileDefinition> = {
  efluente_ptar: LMP_PTAR,
  efluente_pesca: LMP_PESCA,
  cauce: ECA_E2,
  mar: ECA_E3,
};

export function resolveProfileForPointType(
  pointType: MonitoringPointType
): NormativeProfileDefinition {
  return DEFAULTS[pointType];
}

/** Perfil complementario para el cauce cuando se documenta reúso para riego. */
export function irrigationProfile(): NormativeProfileDefinition {
  return ECA_D1;
}
