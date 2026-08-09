/**
 * Validaciones del módulo Estaciones — Sprint 3C
 */

import { ApiError } from "@/server/api/errors";
import {
  validationFailure,
  validationSuccess,
  type ValidationResult,
} from "./validation-result";

const STATION_ID_PATTERN = /^[a-z0-9-]{2,64}$/i;

export function validateStationId(stationId: unknown): ValidationResult {
  if (typeof stationId !== "string" || stationId.trim().length === 0) {
    return validationFailure([
      { field: "id", message: "El identificador de estación es obligatorio" },
    ]);
  }

  const id = stationId.trim();

  if (!STATION_ID_PATTERN.test(id)) {
    return validationFailure([
      {
        field: "id",
        message: "Identificador inválido: use letras, números y guiones (2–64 caracteres)",
      },
    ]);
  }

  return validationSuccess();
}

export function assertValidStationId(stationId: unknown): string {
  const result = validateStationId(stationId);
  if (!result.valid) {
    throw ApiError.validation(result.issues[0]?.message ?? "ID inválido", result.issues);
  }
  return (stationId as string).trim();
}
