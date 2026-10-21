/**
 * GET /api/photo-quality/calibration?parameterCode=turbidity — estado de calibración local
 * del módulo de foto (Nivel 3). Requiere conexión: es la única forma de confirmar el estado
 * VIGENTE (N real, R² actual) en vez de una copia cacheada.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { evaluatePhotoCalibration } from "@/photo-quality/photo-calibration.service";
import type { PhotoCalibrationParameterCode } from "@/photo-quality/photo-calibration.store";
import { isApiError } from "@/server/api/errors";

export const dynamic = "force-dynamic";

const VALID_PARAMETERS = new Set<string>(["turbidity", "total_suspended_solids"]);

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);
    const parameterCode = searchParams.get("parameterCode");

    if (!parameterCode || !VALID_PARAMETERS.has(parameterCode)) {
      return NextResponse.json(
        { error: "parameterCode inválido u obligatorio (turbidity | total_suspended_solids)" },
        { status: 400 }
      );
    }

    const status = evaluatePhotoCalibration(parameterCode as PhotoCalibrationParameterCode);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al evaluar la calibración";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
