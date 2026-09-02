import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authorization/guards";
import { fieldSatelliteValidationService } from "@/server/satellite/validation/field-satellite-validation.service";
import type { ParametroCodigoDb } from "@/database/constants/parametros-catalog";

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

export async function GET(request: Request) {
  try {
    await requirePermission(request, "STATIONS_VIEW");
    const { searchParams } = new URL(request.url);

    const stationId = searchParams.get("stationId");
    if (!stationId) {
      return NextResponse.json({ error: "stationId es obligatorio" }, { status: 400 });
    }

    const parameterRaw = searchParams.get("parameterCode");
    const parameterCode =
      parameterRaw && VALID_PARAMETERS.has(parameterRaw)
        ? (parameterRaw as ParametroCodigoDb)
        : undefined;

    const data = await fieldSatelliteValidationService.validate({
      stationId,
      fechaInicio: searchParams.get("fechaInicio") ?? undefined,
      fechaFin: searchParams.get("fechaFin") ?? undefined,
      parameterCode,
      useGee: searchParams.get("useGee") === "true",
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error en validación campo-satélite";
    const status = message.includes("Forbidden") ? 403 : message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
