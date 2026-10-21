/**
 * Imágenes propias (dron o campo) — apoyo y verificación, NO satélite.
 *
 * GET  /api/imagenes-propias[?format=csv]  registros (fuente = "imagen_propia")
 * POST /api/imagenes-propias               multipart: file, targetLabel, latitude, longitude,
 *                                          [windowM], [cameraLatitude, cameraLongitude]
 */

import { NextResponse } from "next/server";
import { runRouteHandler } from "@/server/api/handler";
import { ApiError } from "@/server/api/errors";
import { requirePermission } from "@/server/authorization/guards";
import { OwnImageError, getOwnImageMaxBytes } from "@/server/own-imagery/own-imagery.processing";
import { createOwnImage, listOwnImages, ownImagesToCsv } from "@/server/own-imagery/own-imagery.service";
import { DREN_REGION_BBOX } from "@/satellite/geo/geojson";

export const dynamic = "force-dynamic";

function num(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function inRegion(lat: number, lon: number) {
  const b = DREN_REGION_BBOX;
  return lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon;
}

export async function GET(request: Request) {
  return runRouteHandler(async () => {
    await requirePermission(request, "STATIONS_VIEW");
    const records = await listOwnImages();
    if (new URL(request.url).searchParams.get("format") === "csv") {
      return new NextResponse(ownImagesToCsv(records), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="imagenes-propias.csv"`,
        },
      });
    }
    return NextResponse.json({ success: true, data: records });
  });
}

export async function POST(request: Request) {
  return runRouteHandler(async () => {
    const user = await requirePermission(request, "IMPORT_DATA");
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > getOwnImageMaxBytes() + 64 * 1024) {
      throw ApiError.validation("El archivo supera el tamaño máximo permitido.");
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!form || !(file instanceof File)) throw ApiError.validation("Adjunte el archivo en el campo 'file'.");

    const latitude = num(form.get("latitude"));
    const longitude = num(form.get("longitude"));
    if (latitude === null || longitude === null || !inRegion(latitude, longitude)) {
      throw ApiError.validation("Indique el punto o tramo (latitud y longitud dentro de la zona del Dren 4000).");
    }
    const camLat = num(form.get("cameraLatitude"));
    const camLon = num(form.get("cameraLongitude"));
    if ((camLat === null) !== (camLon === null) || (camLat !== null && camLon !== null && !inRegion(camLat, camLon))) {
      throw ApiError.validation("La posición de la cámara debe tener latitud y longitud dentro de la zona del dren.");
    }

    try {
      const record = await createOwnImage({
        fileName: file.name,
        bytes: new Uint8Array(await file.arrayBuffer()),
        target: {
          label: String(form.get("targetLabel") ?? "Punto"),
          latitude,
          longitude,
        },
        windowM: num(form.get("windowM")) ?? undefined,
        manualCamera: camLat !== null && camLon !== null ? { latitude: camLat, longitude: camLon } : null,
        uploadedBy: user.email || user.id,
      });
      return NextResponse.json({ success: true, data: record }, { status: 201 });
    } catch (error) {
      if (error instanceof OwnImageError) throw ApiError.validation(error.message);
      throw error;
    }
  });
}
