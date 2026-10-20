/**
 * Servicio de evaluación normativa para la API.
 * Acepta una medición parcial y resuelve el perfil por tipo de punto o por id.
 */

import type { FieldMeasurement } from "@/types";
import {
  evaluateNormative,
  getProfileById,
  resolveProfileForPointType,
  POINT_TYPE_LABELS,
  type MonitoringPointType,
  type NormativeEvaluation,
} from "@/lib/normative";

export interface EvaluateNormativeRequest {
  measurement: Partial<FieldMeasurement>;
  pointType?: MonitoringPointType;
  profileId?: string;
}

export type EvaluateNormativeResponse =
  | {
      ok: true;
      profileId: string;
      profileLabel: string;
      instrument: string;
      evaluation: NormativeEvaluation;
    }
  | { ok: false; error: string };

const POINT_TYPES = Object.keys(POINT_TYPE_LABELS) as MonitoringPointType[];

export function evaluateNormativeRequest(
  input: EvaluateNormativeRequest
): EvaluateNormativeResponse {
  const measurement: FieldMeasurement = {
    id: "api-evaluation",
    stationId: "api",
    sampledAt: new Date().toISOString(),
    isSimulated: false,
    ...input.measurement,
  };

  let profile;

  if (input.profileId) {
    profile = getProfileById(input.profileId);
    if (!profile) {
      return {
        ok: false,
        error: `Perfil desconocido: ${input.profileId}. Valores válidos: ${[...POINT_TYPES].join(", ")}.`,
      };
    }
  } else if (input.pointType && POINT_TYPES.includes(input.pointType)) {
    profile = resolveProfileForPointType(input.pointType);
  } else {
    return {
      ok: false,
      error: "Indica un pointType válido o un profileId.",
    };
  }

  return {
    ok: true,
    profileId: profile.id,
    profileLabel: profile.label,
    instrument: profile.instrument,
    evaluation: evaluateNormative(measurement, profile),
  };
}
