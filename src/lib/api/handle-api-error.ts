"use client";

/**
 * Manejo global de errores de API — Sprint 3E
 */

import { ApiError } from "@/lib/api/client";
import { notifyError } from "@/lib/api/notify";

export function handleApiError(error: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (error instanceof ApiError) {
    notifyError(error);
    return error.message;
  }
  if (error instanceof Error) {
    notifyError(error);
    return error.message;
  }
  notifyError(error, fallback);
  return fallback;
}

export function getApiErrorMessage(error: unknown, fallback = "Ocurrió un error"): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
