/**
 * POST /api/photo-quality/observations — sincroniza una observación de foto capturada en el
 * dispositivo (online u offline) hacia el servidor. Idempotente por `id` — reenviar la misma
 * observación (reintento de sync) nunca la duplica.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { savePhotoObservation } from "@/photo-quality/photo-observation.store";
import type { PhotoObservationInput } from "@/photo-quality/photo-observation.types";
import { listPhotoObservations } from "@/photo-quality/photo-observation.store";
import { isApiError } from "@/server/api/errors";

export const dynamic = "force-dynamic";

function isValidInput(body: unknown): body is PhotoObservationInput {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.capturedAt === "string" &&
    typeof b.hasReferencePanel === "boolean" &&
    typeof b.waterRgb === "object" &&
    typeof b.skyRgb === "object" &&
    (b.connectivityAtCapture === "online" || b.connectivityAtCapture === "offline") &&
    (b.confidenceLevel === "LEVEL_1" || b.confidenceLevel === "LEVEL_2" || b.confidenceLevel === "LEVEL_3")
  );
}

export async function POST(request: Request) {
  try {
    await requirePermission(request, "MEASUREMENTS_CREATE");
    const body = await request.json();

    if (!isValidInput(body)) {
      return NextResponse.json({ error: "Cuerpo de observación inválido o incompleto" }, { status: 400 });
    }

    const result = savePhotoObservation(body);

    return NextResponse.json({
      created: result.created,
      id: result.record.id,
      calibrationPairAdded: result.calibrationPairAdded,
      calibrationPairRejectedReason: result.calibrationPairRejectedReason ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar la observación";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    return NextResponse.json({ observations: listPhotoObservations() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar observaciones";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
