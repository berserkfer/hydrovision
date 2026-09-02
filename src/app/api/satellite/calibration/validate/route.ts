import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import {
  CalibrationValidateInsufficientError,
  scientificCalibrationService,
} from "@/server/satellite/calibration/scientific-calibration.service";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";
import type { SpectralIndexCode } from "@/satellite/catalog/spectral-indices.catalog";

export const dynamic = "force-dynamic";

const VALID_PARAMETERS = new Set<string>([
  "ph",
  "turbidity",
  "conductivity",
  "dissolved_oxygen",
  "temperature",
  "bod5",
  "cod",
  "coliforms",
  "nitrates",
  "phosphates",
  "total_dissolved_solids",
  "flow_rate",
]);

const VALID_INDICES = new Set<string>(["NDVI", "NDCI", "NDWI", "MNDWI", "NDTI", "NDMI"]);

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const stationId = searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json({ error: "stationId es obligatorio" }, { status: 400 });
    }

    const parameterRaw = searchParams.get("parameterCode");
    if (!parameterRaw || !VALID_PARAMETERS.has(parameterRaw)) {
      return NextResponse.json({ error: "parameterCode inválido u obligatorio" }, { status: 400 });
    }

    const predictorRaw = searchParams.get("predictorIndex");
    if (!predictorRaw || !VALID_INDICES.has(predictorRaw)) {
      return NextResponse.json({ error: "predictorIndex inválido u obligatorio" }, { status: 400 });
    }

    const parameterCode = parameterRaw as ParametroCodigoDb;
    const predictorIndex = predictorRaw as SpectralIndexCode;

    if (!scientificCalibrationService.isPredictorCandidate(parameterCode, predictorIndex)) {
      return NextResponse.json(
        {
          status: "INSUFFICIENT_PARAMETER_COVERAGE",
          message: `${predictorIndex} no es índice candidato para ${parameterCode}`,
          scientificStatus: "descriptive_only",
        },
        { status: 422 }
      );
    }

    const data = await scientificCalibrationService.validate({
      stationId,
      parameterCode,
      predictorIndex,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      useGee: searchParams.get("useGee") === "true",
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof CalibrationValidateInsufficientError) {
      return NextResponse.json(error.payload, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Error en validación de calibración";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
