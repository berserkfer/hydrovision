/**
 * Traza del dren para el buscador de tramos.
 *
 * GET    /api/satellite/tramos/traza   traza subida (o null = traza por defecto P1 → P5)
 * POST   /api/satellite/tramos/traza   { name, geojson } — GeoJSON de línea o polígono
 * DELETE /api/satellite/tramos/traza   vuelve a la traza por defecto
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { GeoJsonValidationError, getGeoJsonMaxBytes } from "@/satellite/geo/geojson";
import {
  clearUploadedTrace,
  getStoredTrace,
  saveUploadedTrace,
} from "@/server/satellite/tramos/tramo-finder.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");
    return NextResponse.json({ success: true, data: await getStoredTrace() });
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    const user = await requirePermission(request, "IMPORT_DATA");
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > getGeoJsonMaxBytes() * 1.1 + 1024) {
      throw ApiError.validation("El archivo supera el tamaño máximo permitido.");
    }
    const body = (await request.json().catch(() => null)) as { name?: unknown; geojson?: unknown } | null;
    if (!body || typeof body.geojson !== "string") {
      throw ApiError.validation("Se requiere { name, geojson } con el contenido del archivo GeoJSON.");
    }
    try {
      const stored = await saveUploadedTrace(
        body.geojson,
        typeof body.name === "string" ? body.name : "traza.geojson",
        user.email || user.id
      );
      return NextResponse.json({
        success: true,
        data: {
          name: stored.name,
          hash: stored.hash,
          lines: stored.geometry.lines.length,
          polygons: stored.geometry.polygons.length,
          sourceCrs: stored.geometry.sourceCrs,
        },
      });
    } catch (error) {
      if (error instanceof GeoJsonValidationError) throw ApiError.validation(error.message);
      throw error;
    }
  });
}

export async function DELETE(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "IMPORT_DATA");
    await clearUploadedTrace();
    return NextResponse.json({ success: true });
  });
}
