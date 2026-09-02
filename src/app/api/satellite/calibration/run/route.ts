import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import {
  CalibrationInsufficientDataError,
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

export async function POST(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");

    const body = (await request.json()) as {
      parameterCode?: string;
      predictorIndex?: string;
      stationId?: string;
      fechaInicio?: string;
      fechaFin?: string;
      useGee?: boolean;
    };

    if (!body.stationId) {
      return NextResponse.json({ error: "stationId es obligatorio" }, { status: 400 });
    }
    if (!body.parameterCode || !VALID_PARAMETERS.has(body.parameterCode)) {
      return NextResponse.json({ error: "parameterCode inválido u obligatorio" }, { status: 400 });
    }
    if (!body.predictorIndex || !VALID_INDICES.has(body.predictorIndex)) {
      return NextResponse.json({ error: "predictorIndex inválido u obligatorio" }, { status: 400 });
    }

    const parameterCode = body.parameterCode as ParametroCodigoDb;
    const predictorIndex = body.predictorIndex as SpectralIndexCode;

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

    const data = await scientificCalibrationService.run({
      stationId: body.stationId,
      parameterCode,
      predictorIndex,
      fechaInicio: body.fechaInicio,
      fechaFin: body.fechaFin,
      useGee: body.useGee,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof CalibrationInsufficientDataError) {
      return NextResponse.json(error.payload, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Error en calibración exploratoria";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
