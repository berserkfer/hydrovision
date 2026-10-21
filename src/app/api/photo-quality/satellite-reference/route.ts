/**
 * GET /api/photo-quality/satellite-reference?lat=..&lng=..&date=.. — Nivel 2: busca una
 * escena Sentinel-2 real (±5 días, nubosidad aceptable) para la ubicación/fecha de la foto,
 * vía Microsoft Planetary Computer (mismo adaptador que el resto de la plataforma).
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { findPhotoSatelliteReference } from "@/photo-quality/photo-satellite-reference.service";
import { isApiError } from "@/server/api/errors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const date = searchParams.get("date");

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !date) {
      return NextResponse.json({ error: "lat, lng y date son obligatorios" }, { status: 400 });
    }

    const data = await findPhotoSatelliteReference(lat, lng, date);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al buscar referencia satelital";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
