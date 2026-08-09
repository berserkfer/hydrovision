/**
 * Respuestas HTTP consistentes — Sprint 3C
 */

import { NextResponse } from "next/server";
import { ApiError, isApiError } from "./errors";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    source: "database" | "mock";
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function jsonSuccess<T>(
  data: T,
  source: "database" | "mock",
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        source,
      },
    },
    { status }
  );
}

export function jsonError(error: ApiError): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    },
    { status: error.status }
  );
}

export function handleRouteError(error: unknown): NextResponse<ApiErrorResponse> {
  if (isApiError(error)) {
    return jsonError(error);
  }

  console.error("[API]", error);

  if (error instanceof Error && error.message.includes("Can't reach database")) {
    return jsonError(ApiError.database("No se pudo conectar a PostgreSQL"));
  }

  return jsonError(ApiError.internal());
}
