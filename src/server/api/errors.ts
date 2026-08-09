/**
 * Errores de API — Sprint 3C
 */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "DUPLICATE_ERROR"
  | "FORBIDDEN"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ApiErrorCode,
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static validation(message: string, details?: unknown): ApiError {
    return new ApiError("VALIDATION_ERROR", message, 400, details);
  }

  static notFound(resource: string, id?: string): ApiError {
    const message = id ? `${resource} '${id}' no encontrado` : `${resource} no encontrado`;
    return new ApiError("NOT_FOUND", message, 404);
  }

  static database(message: string, details?: unknown): ApiError {
    return new ApiError("DATABASE_ERROR", message, 503, details);
  }

  static duplicate(message: string, details?: unknown): ApiError {
    return new ApiError("DUPLICATE_ERROR", message, 409, details);
  }

  static forbidden(message = "No tiene permiso para realizar esta acción", details?: unknown): ApiError {
    return new ApiError("FORBIDDEN", message, 403, details);
  }

  static internal(message = "Error interno del servidor"): ApiError {
    return new ApiError("INTERNAL_ERROR", message, 500);
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
