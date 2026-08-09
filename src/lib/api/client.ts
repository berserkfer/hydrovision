/**
 * Cliente HTTP extendido — Sprint 3E
 */

import type { ApiErrorResponse, ApiSuccessResponse } from "@/server/api/response";
import { ApiError } from "@/server/api/errors";

function resolveBaseUrl(): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(`${resolveBaseUrl()}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

async function parseResponse<T>(response: Response, path: string): Promise<T> {
  const body = (await response.json()) as ApiSuccessResponse<T> | ApiErrorResponse;
  if (!response.ok || !body.success) {
    const errorBody = body as ApiErrorResponse;
    const message = errorBody.error?.message ?? `Error HTTP ${response.status} en ${path}`;
    const code = errorBody.error?.code;
    if (response.status === 404 || code === "NOT_FOUND") throw ApiError.notFound("Recurso");
    if (response.status === 400 || code === "VALIDATION_ERROR") {
      throw ApiError.validation(message, errorBody.error?.details);
    }
    if (response.status === 409 || code === "DUPLICATE_ERROR") {
      throw ApiError.validation(message, errorBody.error?.details);
    }
    if (response.status === 503 || code === "DATABASE_ERROR") throw ApiError.database(message);
    throw ApiError.internal(message);
  }
  return body.data;
}

export async function apiGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<T> {
  const url = buildUrl(path, query);
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  return parseResponse<T>(response, path);
}

export async function apiPost<T, B = unknown>(path: string, body: B): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response, path);
}

export async function apiPut<T, B = unknown>(path: string, body: B): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "PUT",
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response, path);
}

export async function apiDelete<T = { id: string }>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  return parseResponse<T>(response, path);
}

export { ApiError };
