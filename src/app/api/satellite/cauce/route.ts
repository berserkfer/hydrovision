/**
 * Polígono del cauce del Dren 4000.
 *
 * GET    /api/satellite/cauce   polígono vigente (o null)
 * POST   /api/satellite/cauce   { name, geojson } — Polygon/MultiPolygon validado
 * DELETE /api/satellite/cauce   vuelve al criterio de cuerpo de agua conexo
 *
 * Con polígono, el píxel de agua debe quedar dentro de él (prioridad sobre la conectividad).
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { GeoJsonValidationError, getGeoJsonMaxBytes } from "@/satellite/geo/geojson";
import {
  deleteChannelPolygon,
  getChannelPolygon,
  saveChannelPolygon,
} from "@/server/satellite/channel/channel-polygon.store";

export const dynamic = "force-dynamic";

function summary(p: Awaited<ReturnType<typeof getChannelPolygon>>) {
  return p
    ? {
        name: p.name,
        uploadedAt: p.uploadedAt,
        uploadedBy: p.uploadedBy,
        hash: p.hash,
        areaM2: p.areaM2,
        vertices: p.vertices,
        polygons: p.polygons.length,
        sourceCrs: p.sourceCrs,
      }
    : null;
}

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");
    return NextResponse.json({ success: true, data: summary(await getChannelPolygon()) });
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
      const stored = await saveChannelPolygon(
        body.geojson,
        typeof body.name === "string" ? body.name : "cauce.geojson",
        user.email || user.id
      );
      return NextResponse.json({ success: true, data: summary(stored) });
    } catch (error) {
      if (error instanceof GeoJsonValidationError) throw ApiError.validation(error.message);
      throw error;
    }
  });
}

export async function DELETE(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "IMPORT_DATA");
    await deleteChannelPolygon();
    return NextResponse.json({ success: true });
  });
}
