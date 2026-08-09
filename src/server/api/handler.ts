/**
 * Utilidades para Route Handlers — Sprint 3C
 */

import type { NextResponse } from "next/server";
import { handleRouteError } from "./response";

export async function runRouteHandler<T extends NextResponse>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return handleRouteError(error) as T;
  }
}
