/**
 * GET /api/environmental-model — el "modelo ambiental" (sin satélite): regresión de un
 * parámetro de campo contra otros parámetros de la MISMA muestra, dataset histórico Dren 4000
 * (Nizama & Cabrera, 2018). Independiente del módulo de predicción satelital.
 */
import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import {
  EnvironmentalModelError,
  environmentalModelService,
} from "@/environmental-model/environmental-model.service";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { EnvironmentalWaterMatrix } from "@/environmental-model/config/environmental-parameters.config";
import { isApiError } from "@/server/api/errors";

export const dynamic = "force-dynamic";

const VALID_MATRICES = new Set<string>(["agua_residual", "agua_marina"]);

const VALID_PARAMETERS = new Set<string>([
  "ph",
  "turbidity",
  "conductivity",
  "dissolved_oxygen",
  "temperature",
  "bod5",
  "cod",
  "coliforms",
  "thermotolerant_coliforms",
  "nitrates",
  "phosphates",
  "total_dissolved_solids",
  "total_suspended_solids",
  "flow_rate",
]);

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const matrixRaw = searchParams.get("matrix");
    if (!matrixRaw || !VALID_MATRICES.has(matrixRaw)) {
      return NextResponse.json(
        { error: "matrix inválido u obligatorio (agua_residual | agua_marina)" },
        { status: 400 }
      );
    }

    const targetRaw = searchParams.get("targetCode");
    if (!targetRaw || !VALID_PARAMETERS.has(targetRaw)) {
      return NextResponse.json({ error: "targetCode inválido u obligatorio" }, { status: 400 });
    }

    const data = environmentalModelService.run(
      matrixRaw as EnvironmentalWaterMatrix,
      targetRaw as ParametroCodigoDb
    );

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof EnvironmentalModelError) {
      return NextResponse.json(error.payload, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Error al evaluar el modelo ambiental";
    const status = isApiError(error) ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
